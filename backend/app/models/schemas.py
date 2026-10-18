"""Strict Pydantic schemas and data models for AuditFlow.

Strictly aligned with:
- docs/04_USER_FLOW_AND_JOURNEY.md (Enums & States)
- docs/06_SYSTEM_ARCHITECTURE.md (JSON contracts & snake_case fields)
- frontend/src/services/mockData.js & apiClient.js
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class InvoiceStatus(str, Enum):
    PROCESSING = "PROCESSING"
    VERIFIED_MATCH = "VERIFIED_MATCH"
    EXCEPTION_FLAGGED = "EXCEPTION_FLAGGED"
    EXTRACTION_FAILED = "EXTRACTION_FAILED"
    APPROVED_CLEAN = "APPROVED_CLEAN"
    APPROVED_WITH_OVERRIDE = "APPROVED_WITH_OVERRIDE"
    REJECTED_DISPUTED = "REJECTED_DISPUTED"


class LineItemStatus(str, Enum):
    MATCH = "MATCH"
    OVERCHARGE = "OVERCHARGE"
    UNDERCHARGE = "UNDERCHARGE"
    UNAPPROVED_ITEM = "UNAPPROVED_ITEM"
    DUPLICATE = "DUPLICATE"
    QUANTITY_MISMATCH = "QUANTITY_MISMATCH"
    MATH_ERROR = "MATH_ERROR"


class DiscrepancySeverity(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class ExtractedLineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    line_number: int
    description: str
    matched_po_line_id: Optional[str] = None
    matched_po_description: Optional[str] = None
    quantity: float = 0.0
    unit_price: float = 0.0
    line_total: float = 0.0


class ExtractedInvoiceData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    vendor_name: Optional[str] = None
    vendor_tax_id: Optional[str] = None
    vendor_email: Optional[str] = None
    iban_or_account: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    po_reference: Optional[str] = None
    currency: str = "USD"
    subtotal: float = 0.0
    tax_total: float = 0.0
    discount_amount: float = 0.0
    grand_total: float = 0.0
    line_items: List[ExtractedLineItem] = Field(default_factory=list)


class ExtractedInvoicePayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    extraction_confidence: float = Field(default=1.0, description="Score from 0.00 to 1.00")
    vendor_name: str
    vendor_tax_id: Optional[str] = None
    vendor_email: Optional[str] = None
    iban_or_account: Optional[str] = None
    invoice_number: str
    invoice_date: str
    due_date: Optional[str] = None
    po_reference: Optional[str] = None
    currency: str = "USD"
    subtotal: float = 0.0
    tax_total: float = 0.0
    discount_amount: float = 0.0
    grand_total: float = 0.0
    line_items: List[ExtractedLineItem] = Field(default_factory=list)
    extraction_mode: Optional[str] = "GEMINI_LIVE"
    processing_latency_ms: Optional[int] = 0


class MatchedPurchaseOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")

    po_number: str
    vendor_name: str
    authorized_total: float
    status: str = "ACTIVE"


class LineItemComparison(BaseModel):
    model_config = ConfigDict(extra="ignore")

    line_number: int
    invoice_description: str
    matched_po_description: Optional[str] = None
    po_quantity: float = 0.0
    invoice_quantity: float = 0.0
    po_unit_price: float = 0.0
    invoice_unit_price: float = 0.0
    po_line_total: float = 0.0
    invoice_line_total: float = 0.0
    variance_amount: float = 0.0
    line_status: str = LineItemStatus.MATCH.value


class Discrepancy(BaseModel):
    model_config = ConfigDict(extra="ignore")

    flag_id: str
    rule_code: str
    severity: str = DiscrepancySeverity.WARNING.value
    title: str
    explanation: str
    financial_impact: float = 0.0


class DisputeEmailDraft(BaseModel):
    model_config = ConfigDict(extra="ignore")

    recipient: str
    subject: str
    body: str


class DecisionMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore")

    timestamp: str
    reviewer_name: str
    justification_notes: str
    decision_type: str


class InvoiceDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    invoice_id: str
    invoice_number: str
    vendor_name: str
    po_reference: Optional[str] = None
    invoice_date: str
    grand_total: float
    currency: str = "USD"
    status: str = InvoiceStatus.PROCESSING.value
    extraction_confidence: float = 1.0
    discrepancy_count: int = 0
    flag_reason: Optional[str] = None
    file_hash_sha256: Optional[str] = None
    file_url: Optional[str] = None
    extraction_mode: Optional[str] = None
    processing_latency_ms: Optional[int] = None
    extracted_data: Optional[ExtractedInvoiceData] = None
    matched_purchase_order: Optional[MatchedPurchaseOrder] = None
    line_item_comparisons: List[LineItemComparison] = Field(default_factory=list)
    discrepancies: List[Discrepancy] = Field(default_factory=list)
    dispute_email_draft: Optional[DisputeEmailDraft] = None
    decision_metadata: Optional[DecisionMetadata] = None


class POLineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    po_line_id: str
    item_code: str
    description: str
    authorized_quantity: float
    authorized_unit_price: float
    authorized_line_total: float


class PurchaseOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")

    po_number: str
    vendor_name: str
    vendor_tax_id: str
    vendor_email: str
    expected_iban: str
    issue_date: str
    currency: str = "USD"
    authorized_subtotal: float
    authorized_tax_total: float = 0.0
    authorized_grand_total: float
    status: str = "ACTIVE"
    line_items: List[POLineItem] = Field(default_factory=list)


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    log_id: str
    timestamp: str
    invoice_id: Optional[str] = None
    invoice_number: str
    vendor_name: Optional[str] = None
    actor_name: str
    action_type: str
    previous_status: str
    new_status: str
    financial_impact_saved: float = 0.0
    justification_notes: str


class KpiMetrics(BaseModel):
    model_config = ConfigDict(extra="ignore")

    total_audited_volume: float
    prevented_leakage_amount: float
    pending_exceptions_count: int
    clean_match_rate_percent: float


class DashboardSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kpis: KpiMetrics
    invoices: List[InvoiceDetail]


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: str = "healthy"
    service: str = "AuditFlow FastAPI Backend"
    timestamp: str
    gemini_configured: bool = False
    extraction_model: str = "gemini-3.5-flash"


class DecisionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    decision: str  # APPROVE_CLEAN, APPROVE_WITH_OVERRIDE, REJECT_DISPUTE
    reviewer_name: Optional[str] = "Ubaid Raza (Senior AP Auditor)"
    justification_notes: Optional[str] = "Approved/disputed by compliance auditor."


class DecisionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    success: bool
    invoice_id: str
    new_status: str
    updated_invoice: Optional[InvoiceDetail] = None
    audit_log_entry: Optional[AuditLogEntry] = None


class DemoScenarioRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    demo_scenario_id: str  # SCENARIO_A_CLEAN, SCENARIO_B_OVERCHARGE, SCENARIO_C_DUPLICATE
