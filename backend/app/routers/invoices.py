"""Invoice analysis, retrieval, human decision, export, and reset router."""

import time
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from app.data.database import get_ledger
from app.models.enums import InvoiceStatus, AuditDecision
from app.models.schemas import DecisionRequest, InvoiceAuditRecord
from app.services.invoice_analyzer import (
    handle_file_analysis,
    handle_scenario_analysis,
    log_analysis_event,
)
from app.services.dossier_exporter import format_json_dossier, format_csv_dossier

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


@router.post("/analyze")
async def analyze_invoice_endpoint(request: Request):
    content_type = request.headers.get("content-type", "")
    ledger = get_ledger()
    po_registry = {po["po_number"].upper(): po for po in ledger.get_purchase_orders()}
    ledger_invoices = ledger.get_all_invoices()

    if "multipart/form-data" in content_type:
        form = await request.form()
        file = form.get("file")
        if not file:
            raise HTTPException(status_code=400, detail="Multipart upload requires a 'file' field.")
        record, telemetry = await handle_file_analysis(file, ledger, po_registry, ledger_invoices)
    else:
        body = await request.json() if (await request.body()) else {}
        scenario_id = body.get("demo_scenario_id") if isinstance(body, dict) else None
        record, telemetry = handle_scenario_analysis(scenario_id or "SCENARIO_B_OVERCHARGE", ledger_invoices, po_registry)

    ledger.save_invoice(record.model_dump())
    log_analysis_event(ledger, record)
    return {"success": True, "stage_telemetry": telemetry, "invoice": record}


@router.get("/{invoice_id}", response_model=InvoiceAuditRecord)
def get_invoice(invoice_id: str) -> InvoiceAuditRecord:
    ledger = get_ledger()
    inv = ledger.get_invoice(invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found in ledger")
    return InvoiceAuditRecord(**inv)


@router.get("/{invoice_id}/export")
def export_invoice_dossier(invoice_id: str, format: str = "json"):
    ledger = get_ledger()
    inv = ledger.get_invoice(invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found in ledger")

    if format.lower() == "csv":
        csv_content, sig = format_csv_dossier(inv)
        headers = {
            "Content-Disposition": f'attachment; filename="audit_dossier_{invoice_id}.csv"',
            "X-AuditFlow-Signature": sig,
        }
        return Response(content=csv_content, media_type="text/csv", headers=headers)

    dossier = format_json_dossier(inv)
    headers = {
        "Content-Disposition": f'attachment; filename="audit_dossier_{invoice_id}.json"',
        "X-AuditFlow-Signature": dossier["cryptographic_signature"],
    }
    return JSONResponse(content=dossier, headers=headers)


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
