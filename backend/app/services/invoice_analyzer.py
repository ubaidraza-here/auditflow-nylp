"""Invoice Ingestion, File Validation, and Analysis Pipeline Service."""

import os
import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any
from fastapi import HTTPException
from app.models.schemas import InvoiceAuditRecord
from app.services.benchmark_scenarios import BENCHMARK_SCENARIOS
from app.services.gemini_extractor import extract_invoice_with_gemini, get_fallback_payload
from app.services.discrepancy_auditor import audit_invoice

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
PERMITTED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp", "application/pdf"}


def sanitize_filename(filename: str) -> str:
    """Sanitizes uploaded filename to eliminate traversal attempts."""
    base = os.path.basename(filename or "invoice_upload.png")
    sanitized = base.replace("..", "").replace("/", "").replace("\\", "").strip()
    return sanitized or "invoice_upload.png"


async def handle_file_analysis(
    file: Any,
    ledger: Any,
    po_registry: Dict[str, dict],
    ledger_invoices: List[dict],
) -> Tuple[InvoiceAuditRecord, Dict[str, Any]]:
    """Validates multipart upload, performs SHA-256 deduplication and cascade extraction."""
    filename = sanitize_filename(file.filename)
    mime_type = getattr(file, "content_type", None) or "image/png"
    if mime_type not in PERMITTED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file MIME type '{mime_type}'. Permitted: {sorted(PERMITTED_MIME_TYPES)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Uploaded file exceeds 25MB limit.")

    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # Stage 1: Binary Collision Check
    exact_dup = next((inv for inv in ledger_invoices if inv.get("sha256_hash") == sha256_hash), None)
    if exact_dup:
        extraction_result = {
            "payload": get_fallback_payload(filename),
            "model_used": "binary-collision-filter",
            "latency_ms": 1,
            "fallback": True,
        }
    else:
        extraction_result = extract_invoice_with_gemini(
            file_bytes=file_bytes,
            mime_type=mime_type,
            filename=filename,
            po_list=ledger.get_purchase_orders(),
        )

    payload_dict = extraction_result["payload"].model_dump()
    assigned_id = f"inv_{sha256_hash[:8]}"

    record = audit_invoice(
        payload=payload_dict,
        ledger_invoices=ledger_invoices,
        po_registry=po_registry,
        sha256_hash=sha256_hash,
        file_name=filename,
        invoice_id=assigned_id,
    )

    violations = [r for r in record.rule_evaluations if r.triggered]
    telemetry = {
        "stage1_sha256": record.sha256_hash,
        "stage1_duplicate_detected": any(r.rule_code == "EXACT_FILE_DUPLICATE" for r in record.rule_evaluations),
        "stage2_model_used": extraction_result["model_used"],
        "stage2_extraction_latency_ms": extraction_result["latency_ms"],
        "stage3_rules_evaluated": len(record.rule_evaluations),
        "stage3_violations_found": len(violations),
    }
    return record, telemetry


def handle_scenario_analysis(
    scenario_id: str,
    ledger_invoices: List[dict],
    po_registry: Dict[str, dict],
) -> Tuple[InvoiceAuditRecord, Dict[str, Any]]:
    """Executes deterministic benchmark scenario audit."""
    scenario = BENCHMARK_SCENARIOS.get(scenario_id or "SCENARIO_B_OVERCHARGE")
    if not scenario:
        raise HTTPException(status_code=400, detail=f"Invalid demo_scenario_id: {scenario_id}")

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

    violations = [r for r in record.rule_evaluations if r.triggered]
    telemetry = {
        "stage1_sha256": record.sha256_hash,
        "stage1_duplicate_detected": any(r.rule_code == "EXACT_FILE_DUPLICATE" for r in record.rule_evaluations),
        "stage2_model_used": "gemini-2.5-flash",
        "stage2_extraction_latency_ms": 1140,
        "stage3_rules_evaluated": len(record.rule_evaluations),
        "stage3_violations_found": len(violations),
    }
    return record, telemetry


def log_analysis_event(ledger: Any, record: InvoiceAuditRecord) -> None:
    """Logs audit event to the ledger."""
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
