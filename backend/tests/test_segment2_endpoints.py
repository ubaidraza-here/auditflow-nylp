"""Integration tests for POST /api/invoices/analyze and POST /api/invoices/{id}/decision."""

from fastapi.testclient import TestClient
from app.main import app
from app.data.database import get_ledger

client = TestClient(app)


def test_analyze_benchmark_scenario_b_overcharge():
    ledger = get_ledger()
    ledger.reset()

    res = client.post("/api/invoices/analyze", json={"demo_scenario_id": "SCENARIO_B_OVERCHARGE"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    inv = data["invoice"]
    assert inv["invoice_number"] == "INV-9042"
    assert inv["status"] == "EXCEPTION_FLAGGED"
    assert inv["total_variance_amount"] == 450.00
    assert inv["dispute_memo"] is not None
    assert "PO-2026-102" in inv["dispute_memo"]

    # Verify audit log was created
    logs = ledger.get_audit_logs()
    assert any("EXCEPTION_DETECTED" in l["event_type"] and l["invoice_id"] == "inv_1002" for l in logs)


def test_analyze_benchmark_scenario_a_clean():
    ledger = get_ledger()
    ledger.reset()

    res = client.post("/api/invoices/analyze", json={"demo_scenario_id": "SCENARIO_A_CLEAN"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    inv = data["invoice"]
    assert inv["invoice_number"] == "INV-8801"
    assert inv["status"] == "VERIFIED_MATCH"
    assert inv["total_variance_amount"] == 0.00
    assert inv["dispute_memo"] is None


def test_analyze_benchmark_scenario_c_duplicate():
    ledger = get_ledger()
    ledger.reset()

    res = client.post("/api/invoices/analyze", json={"demo_scenario_id": "SCENARIO_C_DUPLICATE"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    inv = data["invoice"]
    assert inv["status"] == "EXCEPTION_FLAGGED"
    rule_codes = [r["rule_code"] for r in inv["rule_evaluations"] if r["triggered"]]
    assert "CRITICAL_FUZZY_DUPLICATE" in rule_codes


def test_human_decision_flow_and_kpi_impact():
    ledger = get_ledger()
    ledger.reset()

    summary_before = client.get("/api/dashboard/summary").json()
    pending_before = summary_before["kpis"]["pending_exceptions_count"]
    assert pending_before == 2

    # Reject override with reason < 10 characters
    res_short = client.post(
        "/api/invoices/inv_1002/decision",
        json={"decision": "APPROVE_WITH_OVERRIDE", "reviewer_name": "Ubaid Raza", "override_reason": "Too short"},
    )
    assert res_short.status_code == 400

    # Valid override approval
    res_override = client.post(
        "/api/invoices/inv_1002/decision",
        json={
            "decision": "APPROVE_WITH_OVERRIDE",
            "reviewer_name": "Ubaid Raza",
            "override_reason": "Authorized by VP of Engineering for emergency replacement unit.",
        },
    )
    assert res_override.status_code == 200
    inv = res_override.json()["invoice"]
    assert inv["status"] == "APPROVED_WITH_OVERRIDE"
    assert inv["reviewer_name"] == "Ubaid Raza"

    # Verify pending count decreased by 1
    summary_after = client.get("/api/dashboard/summary").json()
    pending_after = summary_after["kpis"]["pending_exceptions_count"]
    assert pending_after == pending_before - 1


def test_dispute_decision_flow():
    ledger = get_ledger()
    ledger.reset()

    res_dispute = client.post(
        "/api/invoices/inv_1002/decision",
        json={
            "decision": "REJECT_DISPUTE",
            "reviewer_name": "Ubaid Raza",
            "dispute_email_body": "Custom dispute memorandum sent to vendor.",
        },
    )
    assert res_dispute.status_code == 200
    inv = res_dispute.json()["invoice"]
    assert inv["status"] == "REJECTED_DISPUTED"
    assert inv["dispute_memo"] == "Custom dispute memorandum sent to vendor."
