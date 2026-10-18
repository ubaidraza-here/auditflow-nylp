"""AuditFlow FastAPI Backend Entrypoint.

Autonomous Invoice Verification & Discrepancy Auditor.
Runs on Port 5000 with CORS enabled for React Frontend (Port 5173).
"""

from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import HealthResponse
from app.routers import dashboard, invoices, registry

# Load environment variables
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="AuditFlow API",
    description="Autonomous Invoice Verification & Discrepancy Auditor Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware for Frontend React Application
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router with /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """System health check endpoint."""
    raw_key = os.getenv("GEMINI_API_KEY", "").strip()
    is_gemini_configured = bool(raw_key)
    return HealthResponse(
        status="healthy",
        service="AuditFlow FastAPI Backend",
        timestamp=datetime.now(timezone.utc).isoformat(),
        gemini_configured=is_gemini_configured,
        extraction_model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
    )



# Mount feature routers under /api
api_router.include_router(dashboard.router)
api_router.include_router(invoices.router)
api_router.include_router(registry.router)

# Mount the unified /api router to the main application
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root_status():
    """Root entrypoint with service metadata."""
    return {
        "project": "AuditFlow",
        "description": "Autonomous Invoice Verification & Discrepancy Auditor",
        "status": "online",
        "api_docs": "/docs",
        "health_check": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "5000"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"🚀 Starting AuditFlow FastAPI server on http://localhost:{port}...")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
