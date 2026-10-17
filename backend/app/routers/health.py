"""System health and diagnostic router."""

import os
from datetime import datetime, timezone
from fastapi import APIRouter
from app.models.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    primary_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite")
    return HealthResponse(
        status="healthy",
        gemini_configured=bool(gemini_key),
        extraction_model=primary_model,
        fallback_model=fallback_model,
        server_time=datetime.now(timezone.utc).isoformat(),
    )
