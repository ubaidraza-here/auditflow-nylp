"""Automated Verification Suite for AuditFlow Backend Segments 3 & 4.

Verifies:
1. System status and health check (GET /api/health reports gemini_configured).
2. Demo preset JSON trigger (POST /api/invoices/analyze).
3. Multipart file upload to POST /api/invoices/analyze.
4. Exact SHA-256 duplicate file upload triggering Rule 1 (EXACT_FILE_DUPLICATE).
5. Downloadable CSV export of immutable ledger (GET /api/audit-logs/export.csv).
6. Cryptographically signed audit dossier export (GET /api/invoices/inv_1002/export).
"""

import sys

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi.testclient import TestClient
from app.main import app
from app.data.database import db


def run_tests():
    print("=" * 70)
    print("AUDITFLOW BACKEND SEGMENTS 3 & 4 VERIFICATION SUITE")
    print("=" * 70)

    # Reset db to clean state before tests
    db.reset_all()
    client = TestClient(app)

    # -------------------------------------------------------------------------
    # TEST 1: Health Check & Gemini Status
    # -------------------------------------------------------------------------
    print("\n[TEST 1] GET /api/health -- System Status & Gemini Configuration")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    health_data = res.json()
    assert health_data["status"] == "healthy"
    assert "gemini_configured" in health_data
    assert isinstance(health_data["gemini_configured"], bool)
    print("  [OK] Status: healthy")
    print(f"  [OK] Gemini Configured: {health_data['gemini_configured']}")
    print(f"  [OK] Extraction Model: {health_data.get('extraction_model', 'N/A')}")

    # -------------------------------------------------------------------------
    # TEST 2: Demo Scenario Trigger (JSON Mode)
    # -------------------------------------------------------------------------
    print("\n[TEST 2] POST /api/invoices/analyze (JSON Demo Trigger)")
    res = client.post("/api/invoices/analyze", json={"demo_scenario_id": "SCENARIO_B_OVERCHARGE"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    demo_data = res.json()
    assert demo_data["success"] is True
    assert demo_data["invoice"]["invoice_number"] == "INV-9042"
    assert demo_data["invoice"]["status"] == "EXCEPTION_FLAGGED"
    assert len(demo_data["invoice"]["discrepancies"]) >= 2
    print("  [OK] Successfully analyzed demo scenario SCENARIO_B_OVERCHARGE")
    print(f"  [OK] Caught {len(demo_data['invoice']['discrepancies'])} discrepancies on INV-9042")

    # -------------------------------------------------------------------------
    # TEST 3: Multipart File Upload (First Ingestion)
    # -------------------------------------------------------------------------
    print("\n[TEST 3] POST /api/invoices/analyze (Multipart File Upload #1)")
    dummy_pdf_bytes = (
        b"%PDF-1.4\n%AuditFlow Invoice Payload\n"
        b"1 0 obj\n<< /Title (Apex Invoice 9042) >>\nendobj\n"
        b"trailer\n<< /Root 1 0 R >>\n%%EOF"
    )
    files = {
        "file": ("vendor_invoice_apex_tech.pdf", dummy_pdf_bytes, "application/pdf")
    }
    res = client.post("/api/invoices/analyze", files=files)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    upload1_data = res.json()
    assert upload1_data["success"] is True
    assert "invoice" in upload1_data
    inv1 = upload1_data["invoice"]
    inv1_id = inv1["invoice_id"]
    inv1_hash = inv1["file_hash_sha256"]
    assert inv1_hash is not None and len(inv1_hash) == 64
    print(f"  [OK] File successfully uploaded and ingested as: {inv1_id}")
    print(f"  [OK] SHA-256 computed: {inv1_hash[:20]}...")
    print(f"  [OK] Extraction Mode: {inv1.get('extraction_mode')}")
    print(f"  [OK] Audit Status: {inv1.get('status')}")

    # -------------------------------------------------------------------------
    # TEST 4: Exact Duplicate File Upload (Rule 1: EXACT_FILE_DUPLICATE)
    # -------------------------------------------------------------------------
    print("\n[TEST 4] POST /api/invoices/analyze (Duplicate File Upload #2 - Rule 1 Check)")
    res_dup = client.post("/api/invoices/analyze", files=files)
    assert res_dup.status_code == 200, f"Expected 200, got {res_dup.status_code}: {res_dup.text}"
    upload2_data = res_dup.json()
    assert upload2_data["success"] is True
    inv2 = upload2_data["invoice"]
    assert inv2["invoice_id"] != inv1_id, "New invoice ID should be assigned for second upload"
    assert inv2["file_hash_sha256"] == inv1_hash, "File hash must be identical"

    # Check that Rule 1 (EXACT_FILE_DUPLICATE) was triggered
    rule_codes = [d["rule_code"] for d in inv2.get("discrepancies", [])]
    assert "EXACT_FILE_DUPLICATE" in rule_codes, (
        f"Expected EXACT_FILE_DUPLICATE in discrepancy rules! Got: {rule_codes}"
    )
    dup_flag = next(d for d in inv2["discrepancies"] if d["rule_code"] == "EXACT_FILE_DUPLICATE")
    assert dup_flag["severity"] == "CRITICAL"
    assert inv2["status"] == "EXCEPTION_FLAGGED"
    print("  [OK] EXACT_FILE_DUPLICATE successfully triggered!")
    print(f"  [OK] Rule Code: {dup_flag['rule_code']}")
    print(f"  [OK] Severity: {dup_flag['severity']}")
    print(f"  [OK] Title: {dup_flag['title']}")
    print(f"  [OK] Financial Impact: ${dup_flag['financial_impact']:,.2f}")

    # -------------------------------------------------------------------------
    # TEST 5: Downloadable CSV Export of Immutable Ledger
    # -------------------------------------------------------------------------
    print("\n[TEST 5] GET /api/audit-logs/export.csv -- Downloadable CSV Stream")
    res_csv = client.get("/api/audit-logs/export.csv")
    assert res_csv.status_code == 200, f"Expected 200, got {res_csv.status_code}: {res_csv.text}"
    assert "text/csv" in res_csv.headers.get("content-type", "")
    assert 'filename="auditflow_immutable_ledger.csv"' in res_csv.headers.get(
        "content-disposition", ""
    )
    csv_text = res_csv.text
    assert "record_type,record_id,timestamp_or_date" in csv_text
    assert "AUDIT_LOG" in csv_text
    assert "INVOICE_LEDGER" in csv_text
    line_count = len(csv_text.strip().split("\n"))
    print(f"  [OK] 200 OK with Content-Type: {res_csv.headers['content-type']}")
    print(f"  [OK] Content-Disposition: {res_csv.headers['content-disposition']}")
    print(f"  [OK] CSV Export contains {line_count} valid records")

    # -------------------------------------------------------------------------
    # TEST 6: Single Invoice Cryptographically Signed Audit Dossier
    # -------------------------------------------------------------------------
    print("\n[TEST 6] GET /api/invoices/inv_1002/export -- Cryptographic Audit Dossier")
    res_dossier = client.get("/api/invoices/inv_1002/export")
    assert res_dossier.status_code == 200, (
        f"Expected 200, got {res_dossier.status_code}: {res_dossier.text}"
    )
    dossier = res_dossier.json()
    assert "dossier_id" in dossier
    assert "dossier_signature_sha256" in dossier
    assert len(dossier["dossier_signature_sha256"]) == 64
    assert dossier["invoice_metadata"]["invoice_id"] == "inv_1002"
    assert dossier["invoice_metadata"]["invoice_number"] == "INV-9042"
    assert "line_item_comparison_matrix" in dossier
    assert "triggered_discrepancies" in dossier
    assert "dispute_email_draft" in dossier
    assert "audit_summary" in dossier
    assert dossier["audit_summary"]["cryptographic_integrity_status"] == "VERIFIED_AUTHENTIC"
    print(f"  [OK] 200 OK -- Dossier ID: {dossier['dossier_id']}")
    print(f"  [OK] SHA-256 Signature: {dossier['dossier_signature_sha256'][:24]}...")
    print(f"  [OK] Total Line Items: {dossier['audit_summary']['total_line_items']}")
    print(f"  [OK] Discrepancy Count: {dossier['audit_summary']['discrepancy_count']}")
    print(
        f"  [OK] Total Disputed Variance: ${dossier['audit_summary']['total_disputed_variance']:,.2f}"
    )

    # -------------------------------------------------------------------------
    # TEST 7: Single Invoice CSV Dossier Format
    # -------------------------------------------------------------------------
    print("\n[TEST 7] GET /api/invoices/inv_1002/export?format=csv")
    res_dossier_csv = client.get("/api/invoices/inv_1002/export?format=csv")
    assert res_dossier_csv.status_code == 200
    assert "text/csv" in res_dossier_csv.headers.get("content-type", "")
    assert "INV-9042" in res_dossier_csv.text
    print("  [OK] 200 OK -- CSV Dossier Export validated")

    print("\n" + "=" * 70)
    print("ALL 7 AUDITFLOW BACKEND TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\nTEST SUITE FAILED: {type(e).__name__}: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
