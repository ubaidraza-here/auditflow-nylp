"""Dashboard overview and KPI summary router."""

from fastapi import APIRouter
from app.data.database import get_ledger
from app.models.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary() -> DashboardSummaryResponse:
    ledger = get_ledger()
    summary_data = ledger.get_dashboard_summary()
    return DashboardSummaryResponse(**summary_data)
