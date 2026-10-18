"""Audit logs router for immutable forensic history and ledger exports."""

from typing import List
from fastapi import APIRouter, Response
from app.data.database import get_ledger
from app.models.schemas import AuditLogEntry
from app.services.dossier_exporter import format_csv_audit_logs

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogEntry])
def get_audit_logs() -> List[AuditLogEntry]:
    ledger = get_ledger()
    logs = ledger.get_audit_logs()
    return [AuditLogEntry(**log) for log in logs]


@router.get("/export.csv")
def export_audit_logs_csv() -> Response:
    ledger = get_ledger()
    logs = ledger.get_audit_logs()
    csv_content = format_csv_audit_logs(logs)
    headers = {"Content-Disposition": 'attachment; filename="auditflow_audit_trail.csv"'}
    return Response(content=csv_content, media_type="text/csv", headers=headers)
