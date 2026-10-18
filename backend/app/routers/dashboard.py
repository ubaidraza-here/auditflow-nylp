"""Dashboard Router for AuditFlow.

Endpoints:
- GET /api/dashboard/summary: Dynamically computes KPIs and returns invoice queue.
"""

from fastapi import APIRouter
from app.data.database import db
from app.models.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary() -> DashboardSummaryResponse:
    """Dynamically compute and return executive KPIs and invoice queue."""
    summary_data = db.get_dashboard_summary()
    return DashboardSummaryResponse(**summary_data)


@router.post("/reset", response_model=DashboardSummaryResponse)
def reset_dashboard() -> DashboardSummaryResponse:
    """Reset the entire in-memory ledger and audit logs back to pristine initial seed state."""
    db.reset_all()
    summary_data = db.get_dashboard_summary()
    return DashboardSummaryResponse(**summary_data)

