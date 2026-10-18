"""Registry Router for AuditFlow.

Endpoints:
- GET /api/purchase-orders: Return active ERP Purchase Orders.
- GET /api/audit-logs: Return chronological immutable compliance audit logs.
- GET /api/audit-logs/export.csv: Downloadable CSV stream of the audit trail and ledger.
"""

import csv
import io
from typing import List
from fastapi import APIRouter, Response
from app.data.database import db
from app.models.schemas import PurchaseOrder, AuditLogEntry

router = APIRouter(tags=["Registry"])


@router.get("/purchase-orders", response_model=List[PurchaseOrder])
def get_purchase_orders() -> List[PurchaseOrder]:
    """Retrieve all authorized Purchase Orders from the authoritative ERP baseline."""
    pos = db.get_all_purchase_orders()
    return [PurchaseOrder(**po) for po in pos]


@router.get("/audit-logs", response_model=List[AuditLogEntry])
def get_audit_logs() -> List[AuditLogEntry]:
    """Retrieve all chronological compliance audit logs."""
    logs = db.get_all_audit_logs()
    return [AuditLogEntry(**log) for log in logs]


@router.get("/audit-logs/export.csv")
def export_audit_logs_csv() -> Response:
    """Downloadable CSV stream of the entire immutable audit trail and invoice ledger."""
    logs = db.get_all_audit_logs()
    invoices = db.get_all_invoices()

    output = io.StringIO()
    writer = csv.writer(output)

    # Enterprise Ledger Header
    writer.writerow([
        "record_type",
        "record_id",
        "timestamp_or_date",
        "invoice_number",
        "vendor_name",
        "po_reference",
        "actor_or_reviewer",
        "action_or_decision",
        "previous_status",
        "status",
        "financial_amount",
        "discrepancy_count",
        "file_hash_sha256",
        "notes_or_explanation",
    ])

    # 1. Immutable Audit Trail Entries
    for log in logs:
        writer.writerow([
            "AUDIT_LOG",
            log.get("log_id", ""),
            log.get("timestamp", ""),
            log.get("invoice_number", ""),
            log.get("vendor_name", ""),
            "",
            log.get("actor_name", ""),
            log.get("action_type", ""),
            log.get("previous_status", ""),
            log.get("new_status", ""),
            log.get("financial_impact_saved", 0.0),
            0,
            "",
            log.get("justification_notes", ""),
        ])

    # 2. Active Invoice Ledger Records
    for inv in invoices:
        reviewer = (inv.get("decision_metadata") or {}).get("reviewer_name", "System Auditor")
        decision = (inv.get("decision_metadata") or {}).get("decision_type", "AUDITED")
        writer.writerow([
            "INVOICE_LEDGER",
            inv.get("invoice_id", ""),
            inv.get("invoice_date", ""),
            inv.get("invoice_number", ""),
            inv.get("vendor_name", ""),
            inv.get("po_reference", ""),
            reviewer,
            decision,
            "PROCESSING",
            inv.get("status", ""),
            inv.get("grand_total", 0.0),
            inv.get("discrepancy_count", 0),
            inv.get("file_hash_sha256", ""),
            inv.get("flag_reason", ""),
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="auditflow_immutable_ledger.csv"'
        },
    )

