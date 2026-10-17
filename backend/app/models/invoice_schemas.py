"""Invoice line items, extraction payload, and audit record models."""

from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import InvoiceStatus, RuleSeverity, AuditDecision


class BoundingBox(BaseModel):
    ymin: int
    xmin: int
    ymax: int
    xmax: int


class ExtractedLineItem(BaseModel):
    line_number: int
    description: str
    quantity: float
    unit_price: float
    line_total: float
    matched_po_line_id: Optional[str] = None
    bounding_box: Optional[BoundingBox] = None


class DiscrepancyItem(BaseModel):
    rule_code: str
    rule_name: str
    severity: RuleSeverity
    triggered: bool
    message: str
    variance_amount: float
    affected_line_number: Optional[int] = None


class ExtractedInvoicePayload(BaseModel):
    invoice_number: str
    vendor_name: str
    vendor_ntn: Optional[str] = ""
    vendor_email: Optional[str] = ""
    bank_account_or_iban: Optional[str] = ""
    invoice_date: str
    due_date: Optional[str] = ""
    po_reference: Optional[str] = ""
    currency: str = "USD"
    subtotal: float
    tax_total: float = 0.0
    discount_amount: float = 0.0
    grand_total: float
    line_items: List[ExtractedLineItem] = Field(default_factory=list)
    confidence_score: float = 1.0


class LineItemComparison(BaseModel):
    line_number: int
    description: str
    billed_quantity: float
    po_quantity: Optional[float] = None
    billed_unit_price: float
    po_unit_price: Optional[float] = None
    billed_total: float
    po_total: Optional[float] = None
    variance_amount: float = 0.0
    matched_po_line_id: Optional[str] = None
    status: str = "MATCHED"


class DisputeEmailDraft(BaseModel):
    recipient_email: str
    subject: str
    body: str
    credit_memo_amount_requested: float
    invoice_number: str
    po_reference: Optional[str] = None


class DecisionRequest(BaseModel):
    decision: AuditDecision
    reviewer_name: str
    override_reason: Optional[str] = None
    dispute_email_body: Optional[str] = None


class InvoiceAuditRecord(BaseModel):
    id: str
    invoice_number: str
    vendor_name: str
    vendor_ntn: Optional[str] = ""
    vendor_email: Optional[str] = ""
    bank_account_or_iban: Optional[str] = ""
    invoice_date: str
    due_date: Optional[str] = ""
    po_reference: Optional[str] = ""
    currency: str = "USD"
    subtotal: float
    tax_total: float = 0.0
    discount_amount: float = 0.0
    grand_total: float
    po_baseline_grand_total: float
    total_variance_amount: float
    status: InvoiceStatus
    confidence_score: float
    sha256_hash: str
    file_name: str
    line_items: List[ExtractedLineItem] = Field(default_factory=list)
    rule_evaluations: List[DiscrepancyItem] = Field(default_factory=list)
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[str] = None
    override_reason: Optional[str] = None
    dispute_memo: Optional[str] = None
