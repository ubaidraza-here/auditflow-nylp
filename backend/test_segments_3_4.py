"""Automated verification suite for Backend Segments 3 and 4."""

import hashlib
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.data.database import get_ledger
from app.services.gemini_extractor import CASCADE_MODELS, extract_invoice_with_gemini

client = TestClient(app)


def test_stage1_cascade_configuration_and_fallbacks():
    assert len(CASCADE_MODELS) >= 4
    assert CASCADE_MODELS[0] in ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
    res_clean = extract_invoice_with_gemini(b"fake", "image/png", "INV-8801_clean.png", [])
    assert res_clean["payload"].invoice_number == "INV-8801"
    assert res_clean["fallback"] is True
    res_dup = extract_invoice_with_gemini(b"fake", "image/png", "INV-7710_dup.png", [])
    assert res_dup["payload"].invoice_number == "INV-7710-REV"
    res_over = extract_invoice_with_gemini(b"fake", "image/png", "arbitrary_invoice.png", [])
    assert res_over["payload"].invoice_number == "INV-9042"


def test_stage2_resilience_never_500_on_gemini_error():
    with patch.dict("os.environ", {"GEMINI_API_KEY": "fake_test_key"}):
        with patch("google.genai.Client") as mock_client:
            mock_client.return_value.models.generate_content.side_effect = Exception("Rate limit 429 quota exhausted")
            res = extract_invoice_with_gemini(b"img_bytes", "image/png", "sample_overcharge.png", [])
            assert res["fallback"] is True
            assert res["payload"].invoice_number == "INV-9042"


def test_stage3_multipart_upload_and_sha256_duplicate():
    ledger = get_ledger()
    ledger.reset()
    # 1. New file upload
    file_bytes = b"Sample brand new unique invoice bytes 2026"
    expected_hash = hashlib.sha256(file_bytes).hexdigest()
    res = client.post(
        "/api/invoices/analyze",
        files={"file": ("INV-8801_unique.png", file_bytes, "image/png")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["stage_telemetry"]["stage1_sha256"] == expected_hash
    assert data["stage_telemetry"]["stage1_duplicate_detected"] is False

    # 2. Duplicate upload of INV-9042 known hash
    dup_hash_bytes = b"INV-9042 exact hash replica payload"
    # Seed invoice with this hash
    target_hash = hashlib.sha256(dup_hash_bytes).hexdigest()
    ledger.invoices["inv_1002"]["sha256_hash"] = target_hash
    res_dup = client.post(
        "/api/invoices/analyze",
        files={"file": ("INV-9042_dup.png", dup_hash_bytes, "image/png")},
    )
    assert res_dup.status_code == 200
    dup_data = res_dup.json()
    assert dup_data["stage_telemetry"]["stage1_duplicate_detected"] is True
    assert dup_data["stage_telemetry"]["stage2_model_used"] == "binary-collision-filter"
    rule_codes = [r["rule_code"] for r in dup_data["invoice"]["rule_evaluations"] if r["triggered"]]
    assert "EXACT_FILE_DUPLICATE" in rule_codes

    # 3. Validation rejection
    bad_res = client.post("/api/invoices/analyze", files={"file": ("test.exe", b"bytes", "application/x-msdownload")})
    assert bad_res.status_code == 400


def test_stage4_cryptographic_json_dossier_export():
    ledger = get_ledger()
    ledger.reset()
    res = client.get("/api/invoices/inv_1002/export?format=json")
    assert res.status_code == 200
    assert "X-AuditFlow-Signature" in res.headers
    data = res.json()
    assert data["auditflow_dossier_version"] == "1.0.0"
    assert data["invoice_id"] == "inv_1002"
    assert data["invoice_number"] == "INV-9042"
    assert data["cryptographic_signature"] == res.headers["X-AuditFlow-Signature"]
    assert len(data["line_items"]) == 3


def test_stage5_cryptographic_csv_dossier_export():
    ledger = get_ledger()
    ledger.reset()
    res = client.get("/api/invoices/inv_1002/export?format=csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "X-AuditFlow-Signature" in res.headers
    assert "attachment; filename=\"audit_dossier_inv_1002.csv\"" in res.headers["content-disposition"]
    text = res.text
    assert "# AUDITFLOW FORENSIC DOSSIER EXPORT" in text
    assert "# LINE ITEMS RECONCILIATION" in text
    assert "# AUDIT RULE FINDINGS" in text
    assert "INV-9042" in text
    assert "UNIT_PRICE_OVERCHARGE" in text


def test_stage6_audit_logs_csv_streaming_export():
    ledger = get_ledger()
    ledger.reset()
    res = client.get("/api/audit-logs/export.csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment; filename=\"auditflow_audit_trail.csv\"" in res.headers["content-disposition"]
    lines = res.text.strip().splitlines()
    assert len(lines) >= 3
    assert lines[0] == "id,timestamp,invoice_id,invoice_number,event_type,actor,details"
    assert "log_001" in res.text


def test_stage7_health_and_registry_endpoints():
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    res_vendors = client.get("/api/registry/vendors")
    assert res_vendors.status_code == 200
    vendors = res_vendors.json()
    assert len(vendors) >= 3
    v_names = [v["vendor_name"] for v in vendors]
    assert "CloudHost Enterprise PK" in v_names
    assert "Apex Tech Solutions" in v_names

    res_summary = client.get("/api/registry/summary")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["active_contracts_count"] >= 3
    assert summary["authorized_vendors_count"] >= 3
