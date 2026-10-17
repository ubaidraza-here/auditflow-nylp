"""Audit logs router for immutable forensic history."""

from typing import List
from fastapi import APIRouter
from app.data.database import get_ledger
from app.models.schemas import AuditLogEntry

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogEntry])
def get_audit_logs() -> List[AuditLogEntry]:
    ledger = get_ledger()
    logs = ledger.get_audit_logs()
    return [AuditLogEntry(**log) for log in logs]
