"""AuditFlow Backend Main Application Entrypoint."""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    health,
    dashboard,
    invoices,
    purchase_orders,
    audit_logs,
    registry,
)

load_dotenv()

app = FastAPI(
    title="AuditFlow Forensic API",
    description="Enterprise B2B Accounts Payable 3-Way Reconciliation & Forensic Auditing Engine",
    version="1.0.0",
)

allowed_origins = [
    "*",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(invoices.router)
app.include_router(purchase_orders.router)
app.include_router(audit_logs.router)
app.include_router(registry.router)


@app.get("/")
def root():
    return {
        "project": "AuditFlow Forensic AP Ledger",
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "5000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
