"""Purchase order and audit log Pydantic models."""

from typing import List
from pydantic import BaseModel, Field


class PurchaseOrderLine(BaseModel):
    po_line_id: str
    description: str
    quantity: float
    unit_price: float
    line_total: float


class PurchaseOrderRecord(BaseModel):
    po_number: str
    vendor_name: str
    vendor_ntn: str
    vendor_iban: str
    vendor_email: str
    authorized_grand_total: float
    issue_date: str
    line_items: List[PurchaseOrderLine] = Field(default_factory=list)


class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    invoice_id: str
    invoice_number: str
    event_type: str
    actor: str
    details: str
