"""Unit tests for the Deterministic 7-Rule Discrepancy Auditor and Dispute Generator."""

from app.models.enums import RuleSeverity, InvoiceStatus
from app.services.audit_rules import (
    normalize_inv_number,
    check_exact_duplicate,
    check_fuzzy_duplicate,
    check_internal_math,
    check_bank_mismatch,
    reconcile_line_item,
)
from app.services.dispute_generator import build_dispute_email_draft
from app.services.discrepancy_auditor import audit_invoice


def test_rule1_exact_duplicate():
    ledger = [{"id": "inv_orig", "sha256_hash": "abc123hash", "invoice_number": "INV-001", "grand_total": 500.0}]
    dup = check_exact_duplicate("abc123hash", ledger, current_id="inv_new")
    assert dup is not None
    assert dup.rule_code == "EXACT_FILE_DUPLICATE"
    assert dup.severity == RuleSeverity.CRITICAL

    clean = check_exact_duplicate("uniquehash", ledger, current_id="inv_new")
    assert clean is None


def test_rule2_fuzzy_duplicate():
    assert normalize_inv_number("INV-7710-REV") == "INV7710"
    assert normalize_inv_number("INV_7710_COPY") == "INV7710"
    assert normalize_inv_number("INV-7710") == "INV7710"

    ledger = [{
        "id": "inv_1000",
        "invoice_number": "INV-7710",
        "vendor_name": "Prime Office Logistics",
        "grand_total": 1200.00,
        "status": "APPROVED_CLEAN",
    }]
    current = {
        "id": "inv_1003",
        "invoice_number": "INV-7710-REV",
        "vendor_name": "Prime Office Logistics",
        "grand_total": 1200.00,
    }
    dup = check_fuzzy_duplicate(current, ledger, current_id="inv_1003")
    assert dup is not None
    assert dup.rule_code == "CRITICAL_FUZZY_DUPLICATE"


def test_rule3_internal_math():
    lines = [
        {"line_number": 1, "quantity": 10.0, "unit_price": 20.0, "line_total": 200.0},
        {"line_number": 2, "quantity": 2.0, "unit_price": 50.0, "line_total": 120.0}, # Error: 2*50=100
    ]
    discs = check_internal_math(lines, subtotal=320.0, tax=0.0, discount=0.0, grand=350.0) # Grand error: 320 != 350
    codes = [d.rule_code for d in discs]
    assert "INTERNAL_MATH_ERROR" in codes
    assert len(discs) == 2


def test_rule5_reconcile_line_items():
    po_lines = {"POL-1": {"po_line_id": "POL-1", "quantity": 5.0, "unit_price": 100.0}}
    # Overcharge test
    discs, status = reconcile_line_item({"line_number": 1, "matched_po_line_id": "POL-1", "quantity": 5.0, "unit_price": 120.0, "description": "Item A"}, po_lines)
    assert status == "OVERCHARGE"
    assert discs[0].rule_code == "UNIT_PRICE_OVERCHARGE"
    assert discs[0].variance_amount == 100.0 # (120-100)*5

    # Quantity exceeded test
    discs_qty, status_qty = reconcile_line_item({"line_number": 1, "matched_po_line_id": "POL-1", "quantity": 8.0, "unit_price": 100.0, "description": "Item A"}, po_lines)
    assert status_qty == "QUANTITY_MISMATCH"
    assert discs_qty[0].rule_code == "QUANTITY_EXCEEDED"

    # Unapproved test
    discs_unapp, status_unapp = reconcile_line_item({"line_number": 2, "matched_po_line_id": None, "quantity": 1.0, "unit_price": 40.0, "line_total": 40.0, "description": "Rush Fee"}, po_lines)
    assert status_unapp == "UNAPPROVED_ITEM"
    assert discs_unapp[0].rule_code == "UNAPPROVED_LINE_ITEM"


def test_rule6_bank_account_mismatch():
    mismatch = check_bank_mismatch("PK36SCBL00000011223344", "PK91MEZN00010203040506")
    assert mismatch is not None
    assert mismatch.rule_code == "BANK_ACCOUNT_MISMATCH"

    match = check_bank_mismatch("PK-36-SCBL-00000011223344", "PK36SCBL00000011223344")
    assert match is None


def test_dispute_notice_generation():
    draft = build_dispute_email_draft(
        extracted_data={"vendor_name": "Apex Tech Solutions", "invoice_number": "INV-9042", "invoice_date": "2026-10-14"},
        po={"po_number": "PO-2026-102", "vendor_email": "billing@apextech.com", "authorized_grand_total": 2500.00},
        discrepancies=[],
        total_variance_amount=450.00,
        po_baseline_total=2500.00,
        sha256_hash="a4f89d31c2b5e7104b2a9e3d810f4c9a7b6e5d4c3b2a1098f7e6d5c4b3a20198",
    )
    assert draft is not None
    assert "PO-2026-102" in draft.body
    assert "INV-9042" in draft.body
    assert "+$450.00 USD" in draft.body
    assert "5 business days" in draft.body
