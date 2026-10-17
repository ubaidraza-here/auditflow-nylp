"""Dashboard and health check Pydantic response models."""

from typing import List, Optional
from pydantic import BaseModel
from app.models.enums import InvoiceStatus


class DashboardKpis(BaseModel):
    total_audited_volume: float
    prevented_leakage_amount: float
    pending_exceptions_count: int
    clean_match_rate_percent: float


class DashboardInvoiceSummary(BaseModel):
    id: str
    invoice_number: str
    vendor_name: str
    po_reference: Optional[str] = ""
    invoice_date: str
    grand_total: float
    po_baseline_grand_total: float
    total_variance_amount: float
    status: InvoiceStatus
    triggered_rules_count: int
    primary_flag: Optional[str] = None
    confidence_score: float
    sha256_hash: str


class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKpis
    invoices: List[DashboardInvoiceSummary]


class HealthResponse(BaseModel):
    status: str
    gemini_configured: bool
    extraction_model: str
    fallback_model: str
    server_time: str
