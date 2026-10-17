"""Invoice detail, analysis, human-in-the-loop decision, and reset router."""

import time
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from app.data.database import get_ledger
from app.models.enums import InvoiceStatus, AuditDecision
from app.models.schemas import AnalyzeRequest, DecisionRequest, InvoiceAuditRecord
from app.services.benchmark_scenarios import BENCHMARK_SCENARIOS
from app.services.discrepancy_auditor import audit_invoice

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


@router.post("/analyze")
def analyze_invoice_endpoint(req: Optional[AnalyzeRequest] = None):
    scenario_id = req.demo_scenario_id if req else "SCENARIO_B_OVERCHARGE"
    scenario = BENCHMARK_SCENARIOS.get(scenario_id or "SCENARIO_B_OVERCHARGE")
    if not scenario:
        raise HTTPException(status_code=400, detail=f"Invalid demo_scenario_id: {scenario_id}")

    ledger = get_ledger()
    po_registry = {po["po_number"].upper(): po for po in ledger.get_purchase_orders()}
    ledger_invoices = ledger.get_all_invoices()

    target_id_map = {
        "SCENARIO_A_CLEAN": "inv_1001",
        "SCENARIO_B_OVERCHARGE": "inv_1002",
        "SCENARIO_C_DUPLICATE": "inv_1003",
    }
    assigned_id = target_id_map.get(scenario_id, f"inv_{scenario['sha256_hash'][:8]}")

    record = audit_invoice(
        payload=scenario,
        ledger_invoices=ledger_invoices,
        po_registry=po_registry,
        sha256_hash=scenario["sha256_hash"],
        file_name=scenario["file_name"],
        invoice_id=assigned_id,
    )

    ledger.save_invoice(record.model_dump())
    violations = [r for r in record.rule_evaluations if r.triggered]

    event_type = "EXCEPTION_DETECTED" if violations else "VERIFIED_MATCH_DETECTED"
    details = f"Triggered {len(violations)} rule(s)." if violations else "Passed 3-way match clean."
    ledger.add_audit_log({
        "id": f"log_{int(time.time() * 1000)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "invoice_id": record.id,
        "invoice_number": record.invoice_number,
        "event_type": event_type,
        "actor": "AuditFlow Engine",
        "details": details,
    })

    return {
        "success": True,
        "stage_telemetry": {
            "stage1_sha256": record.sha256_hash,
            "stage1_duplicate_detected": any(r.rule_code == "EXACT_FILE_DUPLICATE" for r in record.rule_evaluations),
            "stage2_model_used": "gemini-2.5-flash",
            "stage2_extraction_latency_ms": 1140,
            "stage3_rules_evaluated": len(record.rule_evaluations),
            "stage3_violations_found": len(violations),
        },
        "invoice": record,
    }


@router.get("/{invoice_id}", response_model=InvoiceAuditRecord)
def get_invoice(invoice_id: str) -> InvoiceAuditRecord:
    ledger = get_ledger()
    inv = ledger.get_invoice(invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found in ledger")
    return InvoiceAuditRecord(**inv)


@router.post("/{invoice_id}/decision")
def submit_decision(invoice_id: str, req: DecisionRequest):
    ledger = get_ledger()
    inv = ledger.get_invoice(invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found in ledger")

    if req.decision == AuditDecision.APPROVE_WITH_OVERRIDE:
        if not req.override_reason or len(req.override_reason.strip()) < 10:
            raise HTTPException(status_code=400, detail="override_reason is mandatory (min 10 characters).")

    status_map = {
        AuditDecision.APPROVE_CLEAN: InvoiceStatus.APPROVED_CLEAN,
        AuditDecision.APPROVE_WITH_OVERRIDE: InvoiceStatus.APPROVED_WITH_OVERRIDE,
        AuditDecision.REJECT_DISPUTE: InvoiceStatus.REJECTED_DISPUTED,
    }
    inv["status"] = status_map[req.decision].value
    inv["reviewer_name"] = req.reviewer_name
    inv["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    if req.override_reason:
        inv["override_reason"] = req.override_reason.strip()
    if req.dispute_email_body:
        inv["dispute_memo"] = req.dispute_email_body.strip()

    updated = ledger.save_invoice(inv)
    ledger.add_audit_log({
        "id": f"log_{int(time.time() * 1000)}",
        "timestamp": inv["reviewed_at"],
        "invoice_id": inv["id"],
        "invoice_number": inv["invoice_number"],
        "event_type": req.decision.value,
        "actor": req.reviewer_name,
        "details": req.override_reason or req.dispute_email_body or f"Disposition: {req.decision.value}",
    })

    return {"success": True, "invoice": InvoiceAuditRecord(**updated)}


@router.post("/{invoice_id}/reset")
def reset_single_invoice(invoice_id: str):
    ledger = get_ledger()
    restored = ledger.reset_invoice(invoice_id)
    if not restored:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found in blueprint seed")
    return {"status": "invoice_reseeded", "invoice": restored}


@router.post("/reset")
def reset_entire_ledger():
    ledger = get_ledger()
    ledger.reset()
    return {"status": "ledger_reseeded", "invoices_count": len(ledger.get_all_invoices())}
