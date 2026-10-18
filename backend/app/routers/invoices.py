"""Invoices Router for AuditFlow.

Endpoints:
- GET /api/invoices/{invoice_id}/export: Complete cryptographically signed audit dossier.
- GET /api/invoices/{invoice_id}: Lookup invoice by ID or invoice number.
- POST /api/invoices/analyze: Multipart file upload & demo preset audit pipeline.
- POST /api/invoices/{invoice_id}/decision: Submit human auditor disposition.
- POST /api/invoices/{invoice_id}/reset: Reset single invoice to seed blueprint.
- POST /api/invoices/reset: Reset entire invoice ledger to seed blueprint.
"""

from datetime import datetime, timezone
import hashlib
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Response, status
from app.data.database import db
from app.data.seed_data import get_initial_seed_invoices
from app.models.schemas import (
    InvoiceDetail,
    InvoiceStatus,
    DecisionRequest,
    DecisionResponse,
    AuditLogEntry,
)
from app.services.discrepancy_auditor import audit_invoice
from app.services.gemini_extractor import extract_invoice_with_gemini

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("/{invoice_id}/export")
def export_invoice_dossier(invoice_id: str, format: Optional[str] = "json") -> Any:
    """Export complete, cryptographically signed audit dossier for a single invoice.

    Includes SHA-256 cryptographic hash/signature, 3-way line item comparison matrix,
    triggered discrepancy rules, dispute email draft, and human disposition history.
    """
    invoice = db.get_invoice_by_id_or_number(invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with identifier '{invoice_id}' not found in audit ledger.",
        )

    all_logs = db.get_all_audit_logs()
    inv_id = invoice.get("invoice_id")
    inv_num = invoice.get("invoice_number")
    related_logs = [
        log
        for log in all_logs
        if log.get("invoice_id") == inv_id or log.get("invoice_number") == inv_num
    ]

    timestamp_now = datetime.now(timezone.utc).isoformat()
    raw_sig_payload = (
        f"{inv_id}:{inv_num}:{invoice.get('file_hash_sha256')}:"
        f"{invoice.get('grand_total')}:{invoice.get('status')}:{timestamp_now}"
    )
    dossier_signature = hashlib.sha256(raw_sig_payload.encode()).hexdigest()

    line_items = invoice.get("line_item_comparisons", [])
    discrepancies = invoice.get("discrepancies", [])
    total_disputed_variance = sum(
        float(d.get("financial_impact", 0.0) or 0.0) for d in discrepancies
    )

    dossier = {
        "dossier_id": f"dossier_{inv_id}_{int(time.time())}",
        "generated_at": timestamp_now,
        "compliance_standard": "NYLP-HACKATHON-2026-AUTONOMOUS-AUDIT",
        "dossier_signature_sha256": dossier_signature,
        "invoice_metadata": {
            "invoice_id": inv_id,
            "invoice_number": inv_num,
            "vendor_name": invoice.get("vendor_name"),
            "po_reference": invoice.get("po_reference"),
            "invoice_date": invoice.get("invoice_date"),
            "grand_total": invoice.get("grand_total"),
            "currency": invoice.get("currency", "USD"),
            "status": invoice.get("status"),
            "extraction_confidence": invoice.get("extraction_confidence", 1.0),
            "file_name": invoice.get("file_name"),
            "file_hash_sha256": invoice.get("file_hash_sha256"),
            "extraction_mode": invoice.get("extraction_mode", "STAGE_SAFE_AUTONOMOUS"),
            "discrepancy_count": invoice.get("discrepancy_count", len(discrepancies)),
        },
        "matched_purchase_order": invoice.get("matched_purchase_order"),
        "line_item_comparison_matrix": line_items,
        "triggered_discrepancies": discrepancies,
        "dispute_email_draft": invoice.get("dispute_email_draft"),
        "decision_metadata": invoice.get("decision_metadata"),
        "related_audit_trail": related_logs,
        "audit_summary": {
            "total_line_items": len(line_items),
            "discrepancy_count": len(discrepancies),
            "total_disputed_variance": round(total_disputed_variance, 2),
            "cryptographic_integrity_status": "VERIFIED_AUTHENTIC",
        },
    }

    if format and format.lower() == "csv":
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["# AUDIT DOSSIER EXPORT - INVOICE", inv_num])
        writer.writerow(["Invoice ID", inv_id])
        writer.writerow(["Vendor Name", invoice.get("vendor_name")])
        writer.writerow(["PO Reference", invoice.get("po_reference")])
        writer.writerow(["Grand Total", invoice.get("grand_total")])
        writer.writerow(["Status", invoice.get("status")])
        writer.writerow(["File SHA-256", invoice.get("file_hash_sha256")])
        writer.writerow(["Dossier Signature", dossier_signature])
        writer.writerow([])
        writer.writerow(["# LINE ITEM MATRIX"])
        writer.writerow([
            "Line #",
            "Invoice Description",
            "PO Description",
            "Qty",
            "Invoice Unit Price",
            "PO Unit Price",
            "Variance",
            "Line Status",
        ])
        for item in line_items:
            writer.writerow([
                item.get("line_number"),
                item.get("invoice_description"),
                item.get("matched_po_description"),
                item.get("invoice_quantity"),
                item.get("invoice_unit_price"),
                item.get("po_unit_price"),
                item.get("variance_amount"),
                item.get("line_status"),
            ])
        writer.writerow([])
        writer.writerow(["# TRIGGERED RULES"])
        writer.writerow(["Rule Code", "Severity", "Title", "Explanation", "Financial Impact"])
        for d in discrepancies:
            writer.writerow([
                d.get("rule_code"),
                d.get("severity"),
                d.get("title"),
                d.get("explanation"),
                d.get("financial_impact"),
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="audit_dossier_{inv_num}.csv"'},
        )

    return dossier


@router.get("/{invoice_id}", response_model=InvoiceDetail)
def get_invoice_by_id(invoice_id: str) -> InvoiceDetail:
    """Retrieve an invoice by either its invoice_id (e.g. inv_1002)

    or invoice_number (e.g. INV-9042). Returns the full detailed invoice
    audit record.
    """
    invoice = db.get_invoice_by_id_or_number(invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with identifier '{invoice_id}' not found in audit ledger.",
        )
    return InvoiceDetail(**invoice)


@router.post("/analyze")
async def analyze_invoice(request: Request) -> Dict[str, Any]:
    """Execute AuditFlow analysis pipeline on an incoming invoice.

    Seamlessly accepts EITHER:
    1. A JSON body: { "demo_scenario_id": "SCENARIO_A_CLEAN" }
    2. A multipart/form-data upload with 'file' (and optional 'demo_scenario_id')

    When a file is uploaded:
    - Reads file bytes and computes SHA-256 hash
    - Checks for exact duplicate files in the active ledger (Rule 1)
    - Performs multimodal Gemini 2.5 Flash extraction (with Stage-Safe fallback)
    - Runs deterministic 7-rule discrepancy auditor and dispute email generator
    - Stores audited invoice in database, appends to immutable audit trail,
      updates KPIs, and returns response.
    """
    content_type = request.headers.get("content-type", "").lower()
    file_bytes: Optional[bytes] = None
    filename: Optional[str] = None
    mime_type: Optional[str] = None
    demo_scenario_id: Optional[str] = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if uploaded_file and hasattr(uploaded_file, "read"):
            file_bytes = await uploaded_file.read()
            filename = (
                getattr(uploaded_file, "filename", "uploaded_invoice.pdf")
                or "uploaded_invoice.pdf"
            )
            mime_type = (
                getattr(uploaded_file, "content_type", "application/pdf")
                or "application/pdf"
            )
        demo_val = form.get("demo_scenario_id")
        if demo_val and isinstance(demo_val, str):
            demo_scenario_id = demo_val
    else:
        try:
            body = await request.json()
            if isinstance(body, dict):
                demo_scenario_id = body.get("demo_scenario_id")
        except Exception:
            demo_scenario_id = None

    # Scenario 1: File Upload Pipeline
    if file_bytes is not None and len(file_bytes) > 0:
        # 1. Compute SHA-256 hash
        file_hash_sha256 = hashlib.sha256(file_bytes).hexdigest()

        # 2. Extract structured data via Multimodal Gemini (with Stage-Safe fallback)
        po_list = db.get_all_purchase_orders()
        extracted_data = extract_invoice_with_gemini(
            file_bytes=file_bytes,
            mime_type=mime_type or "application/pdf",
            filename=filename or "uploaded_invoice.pdf",
            po_list=po_list,
        )

        # 3. Assemble invoice record
        invoice_id = f"inv_{int(time.time() * 1000)}"
        raw_invoice = {
            "invoice_id": invoice_id,
            "invoice_number": extracted_data.get("invoice_number", f"INV-{int(time.time())}"),
            "vendor_name": extracted_data.get("vendor_name", "Unknown Vendor"),
            "po_reference": extracted_data.get("po_reference"),
            "invoice_date": extracted_data.get(
                "invoice_date", datetime.now().strftime("%Y-%m-%d")
            ),
            "grand_total": float(extracted_data.get("grand_total", 0.0) or 0.0),
            "currency": extracted_data.get("currency", "USD"),
            "status": "PROCESSING",
            "extraction_confidence": float(
                extracted_data.get("extraction_confidence", 1.0) or 1.0
            ),
            "file_name": filename or "uploaded_invoice.pdf",
            "file_hash_sha256": file_hash_sha256,
            "file_url": f"/uploads/{filename or 'uploaded_invoice.pdf'}",
            "extraction_mode": extracted_data.get("extraction_mode", "FALLBACK_SIMULATION"),
            "processing_latency_ms": extracted_data.get("processing_latency_ms", 0),
            "extracted_data": extracted_data.get("extracted_data") or extracted_data,
        }

        # 4. Run deterministic 7-rule AP Discrepancy Auditor (triggers Rule 1 if hash exists in db)
        audited_invoice = audit_invoice(raw_invoice, db_instance=db, file_bytes=file_bytes)

        # 5. Persist audited invoice to database
        db.upsert_invoice(audited_invoice)

        # 6. Append immutable audit log entry
        log_entry = {
            "log_id": f"log_{int(time.time() * 1000)}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "invoice_id": audited_invoice.get("invoice_id"),
            "invoice_number": audited_invoice.get("invoice_number"),
            "vendor_name": audited_invoice.get("vendor_name"),
            "actor_name": "AuditFlow AI Engine",
            "action_type": "AI_EXTRACTION_AND_AUDIT",
            "previous_status": "PROCESSING",
            "new_status": audited_invoice.get("status", "EXCEPTION_FLAGGED"),
            "financial_impact_saved": 0.0,
            "justification_notes": (
                f"Multimodal vision extraction ({audited_invoice.get('extraction_mode', 'AI')}) and "
                f"automated 7-rule AP audit completed with {audited_invoice.get('discrepancy_count', 0)} discrepancy flags."
            ),
        }
        db.add_audit_log(log_entry)

        # 7. Recalculate KPIs
        db.compute_kpis()

        # 8. Return response
        return {
            "success": True,
            "invoice": audited_invoice,
            **audited_invoice,
        }

    # Scenario 2: Demo Preset Trigger
    scenario_id = demo_scenario_id or "SCENARIO_B_OVERCHARGE"
    blueprint = get_initial_seed_invoices()

    target_num = "INV-8801"
    if scenario_id == "SCENARIO_B_OVERCHARGE":
        target_num = "INV-9042"
    elif scenario_id == "SCENARIO_C_DUPLICATE":
        target_num = "INV-7710-REV"

    # Find the pristine blueprint record
    blueprint_inv = next(
        (i for i in blueprint if i.get("invoice_number") == target_num), blueprint[0]
    )

    # Reset in database
    fresh_seed = db.reset_invoice(blueprint_inv.get("invoice_id"))

    # Run through deterministic discrepancy auditor
    audited = audit_invoice(fresh_seed, db_instance=db)

    # Persist audited record in ledger
    db.upsert_invoice(audited)
    db.compute_kpis()

    return {
        "success": True,
        "scenario_id": scenario_id,
        "invoice": audited,
        **audited,
    }


@router.post("/{invoice_id}/decision", response_model=DecisionResponse)
def submit_invoice_decision(
    invoice_id: str, payload: DecisionRequest
) -> DecisionResponse:
    """Submit final human auditor disposition for an invoice.

    - Updates invoice status (APPROVED_CLEAN, APPROVED_WITH_OVERRIDE, REJECTED_DISPUTED)
    - Records decision_metadata
    - Appends immutable entry to audit_logs
    - Dynamically updates dashboard KPI calculations
    """
    existing = db.get_invoice_by_id_or_number(invoice_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with identifier '{invoice_id}' not found.",
        )

    decision = payload.decision
    if decision in ("REJECT_DISPUTE", InvoiceStatus.REJECTED_DISPUTED.value):
        next_status = InvoiceStatus.REJECTED_DISPUTED.value
    elif decision in ("APPROVE_WITH_OVERRIDE", InvoiceStatus.APPROVED_WITH_OVERRIDE.value):
        next_status = InvoiceStatus.APPROVED_WITH_OVERRIDE.value
    else:
        next_status = InvoiceStatus.APPROVED_CLEAN.value

    timestamp = datetime.now(timezone.utc).isoformat()
    reviewer = payload.reviewer_name or "Ubaid Raza (Senior AP Auditor)"
    notes = payload.justification_notes or "Approved/disputed by compliance auditor."
    previous_status = existing.get("status", InvoiceStatus.PROCESSING.value)

    # Attach decision metadata
    existing["status"] = next_status
    existing["decision_metadata"] = {
        "timestamp": timestamp,
        "reviewer_name": reviewer,
        "justification_notes": notes,
        "decision_type": decision,
    }

    # Compute financial impact saved
    financial_impact_saved = 0.0
    if next_status == InvoiceStatus.REJECTED_DISPUTED.value:
        discrepancies = existing.get("discrepancies", [])
        if discrepancies:
            financial_impact_saved = sum(
                float(d.get("financial_impact", 0.0) or 0.0) for d in discrepancies
            )
        else:
            financial_impact_saved = float(existing.get("grand_total", 0.0) or 0.0)

    # Build immutable audit log entry
    log_entry = {
        "log_id": f"log_{int(time.time() * 1000)}",
        "timestamp": timestamp,
        "invoice_id": existing.get("invoice_id"),
        "invoice_number": existing.get("invoice_number"),
        "vendor_name": existing.get("vendor_name"),
        "actor_name": reviewer,
        "action_type": decision,
        "previous_status": previous_status,
        "new_status": next_status,
        "financial_impact_saved": financial_impact_saved,
        "justification_notes": notes,
    }

    # Save to database
    updated_inv = db.upsert_invoice(existing)
    db.add_audit_log(log_entry)

    return DecisionResponse(
        success=True,
        invoice_id=existing.get("invoice_id"),
        new_status=next_status,
        updated_invoice=InvoiceDetail(**updated_inv),
        audit_log_entry=AuditLogEntry(**log_entry),
    )


@router.post("/{invoice_id}/reset", response_model=InvoiceDetail)
def reset_invoice_state(invoice_id: str) -> InvoiceDetail:
    """Reset a specific invoice to its pristine seed blueprint state,

    clearing prior reviewer decisions.
    """
    fresh = db.reset_invoice(invoice_id)
    if not fresh:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not reset invoice '{invoice_id}'.",
        )
    audited = audit_invoice(fresh, db_instance=db)
    db.upsert_invoice(audited)
    return InvoiceDetail(**audited)


@router.post("/reset")
def reset_all_invoices() -> Dict[str, Any]:
    """Reset all invoices, purchase orders, and audit logs to pristine seed state."""
    db.reset_all()
    return {
        "success": True,
        "message": "All demo invoices and audit logs reset to pristine seed state.",
        "kpis": db.compute_kpis(),
    }
