"""Automated verification tests for Backend Segment 1."""

import os
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.data.database import get_ledger

client = TestClient(app)


def test_python_modules_under_160_lines():
    backend_dir = Path(__file__).resolve().parent.parent
    for py_file in backend_dir.rglob("*.py"):
        if ".venv" in py_file.parts or "venv" in py_file.parts:
            continue
        line_count = len(py_file.read_text(encoding="utf-8").splitlines())
        assert (
            line_count <= 160
        ), f"File {py_file.relative_to(backend_dir)} has {line_count} lines (>160)"


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "extraction_model" in data
    assert "server_time" in data


def test_dashboard_summary():
    ledger = get_ledger()
    ledger.reset()
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "invoices" in data
    kpis = data["kpis"]
    assert kpis["total_audited_volume"] == 142850.00
    assert kpis["prevented_leakage_amount"] == 4320.50
    assert kpis["pending_exceptions_count"] == 2
    assert kpis["clean_match_rate_percent"] == 75.0
    assert len(data["invoices"]) == 6


def test_invoice_dual_lookup():
    res_id = client.get("/api/invoices/inv_1002")
    assert res_id.status_code == 200
    inv = res_id.json()
    assert inv["invoice_number"] == "INV-9042"
    assert inv["vendor_name"] == "Apex Tech Solutions"
    assert inv["grand_total"] == 2950.00
    assert inv["status"] == "EXCEPTION_FLAGGED"

    res_num = client.get("/api/invoices/INV-9042")
    assert res_num.status_code == 200
    assert res_num.json()["id"] == "inv_1002"

    res_case = client.get("/api/invoices/inv-9042")
    assert res_case.status_code == 200
    assert res_case.json()["id"] == "inv_1002"


def test_invoice_not_found():
    res = client.get("/api/invoices/non_existent_invoice_9999")
    assert res.status_code == 404
    assert res.json()["detail"] == "Invoice not found in ledger"


def test_purchase_orders():
    res = client.get("/api/purchase-orders")
    assert res.status_code == 200
    pos = res.json()
    assert len(pos) == 3
    po_numbers = [po["po_number"] for po in pos]
    assert "PO-2026-101" in po_numbers
    assert "PO-2026-102" in po_numbers
    assert "PO-2026-103" in po_numbers


def test_audit_logs():
    res = client.get("/api/audit-logs")
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) >= 2
    log_ids = [l["id"] for l in logs]
    assert "log_001" in log_ids
    assert "log_002" in log_ids


def test_reset_endpoints():
    ledger = get_ledger()
    ledger.invoices["inv_1002"]["status"] = "APPROVED_CLEAN"
    assert ledger.invoices["inv_1002"]["status"] == "APPROVED_CLEAN"

    res_single = client.post("/api/invoices/inv_1002/reset")
    assert res_single.status_code == 200
    assert ledger.invoices["inv_1002"]["status"] == "EXCEPTION_FLAGGED"

    ledger.invoices.pop("inv_1001", None)
    res_all = client.post("/api/invoices/reset")
    assert res_all.status_code == 200
    assert "inv_1001" in ledger.invoices
    assert res_all.json()["invoices_count"] == 6
