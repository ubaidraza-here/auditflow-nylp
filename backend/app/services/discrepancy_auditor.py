"""Deterministic 7-Rule Discrepancy Auditor Engine."""

from typing import Dict, List, Optional
from app.models.enums import InvoiceStatus, RuleSeverity
from app.models.schemas import DiscrepancyItem, InvoiceAuditRecord
from app.services.audit_rules import (
    check_exact_duplicate,
    check_fuzzy_duplicate,
    check_internal_math,
    check_bank_mismatch,
    reconcile_line_item,
)
from app.services.dispute_generator import build_dispute_email_draft


def audit_invoice(
    payload: dict,
    ledger_invoices: List[dict],
    po_registry: Dict[str, dict],
    sha256_hash: str,
    file_name: str,
    invoice_id: Optional[str] = None,
) -> InvoiceAuditRecord:
    inv_id = invoice_id or f"inv_{sha256_hash[:8]}"
    rules: List[DiscrepancyItem] = []

    # Rule 1: EXACT_FILE_DUPLICATE
    r1 = check_exact_duplicate(sha256_hash, ledger_invoices, inv_id)
    if r1:
        rules.append(r1)

    # Rule 2: CRITICAL_FUZZY_DUPLICATE
    r2 = check_fuzzy_duplicate(payload, ledger_invoices, inv_id)
    if r2:
        rules.append(r2)

    # Rule 3: INTERNAL_MATH_ERROR
    math_discs = check_internal_math(
        payload.get("line_items", []),
        payload.get("subtotal", 0.0),
        payload.get("tax_total", 0.0),
        payload.get("discount_amount", 0.0),
        payload.get("grand_total", 0.0),
    )
    rules.extend(math_discs)

    # Rule 4: MISSING_OR_INVALID_PO
    po_ref = (payload.get("po_reference") or "").strip().upper()
    po = po_registry.get(po_ref)
    if not po_ref or not po:
        rules.append(DiscrepancyItem(
            rule_code="MISSING_OR_INVALID_PO",
            rule_name="Missing or Invalid Purchase Order",
            severity=RuleSeverity.HIGH,
            triggered=True,
            message=f"PO reference '{po_ref or 'NONE'}' not found in authorized ERP registry.",
            variance_amount=round(float(payload.get("grand_total", 0.0)), 2),
        ))
        po_baseline = 0.0
    else:
        po_baseline = float(po.get("authorized_grand_total", 0.0))

        # Rule 5: 3-Way Line Item Reconciliation
        po_lines = {item["po_line_id"]: item for item in po.get("line_items", [])}
        for line in payload.get("line_items", []):
            line_discs, line_status = reconcile_line_item(line, po_lines)
            rules.extend(line_discs)

        # Rule 6: BANK_ACCOUNT_MISMATCH
        r6 = check_bank_mismatch(payload.get("bank_account_or_iban", ""), po.get("vendor_iban", ""))
        if r6:
            rules.append(r6)

    # Rule 7: LOW_EXTRACTION_CONFIDENCE
    conf = float(payload.get("confidence_score", 1.0))
    if conf < 0.85:
        rules.append(DiscrepancyItem(
            rule_code="LOW_EXTRACTION_CONFIDENCE",
            rule_name="Low Optical Extraction Confidence",
            severity=RuleSeverity.WARNING,
            triggered=True,
            message=f"Optical extraction confidence ({conf:.2f}) is below the required 0.85 threshold.",
            variance_amount=0.0,
        ))

    grand_total = round(float(payload.get("grand_total", 0.0)), 2)
    po_baseline = round(po_baseline, 2)
    variance = round(grand_total - po_baseline, 2)

    triggered_rules = [r for r in rules if r.triggered]
    status = InvoiceStatus.EXCEPTION_FLAGGED if triggered_rules or conf < 0.85 else InvoiceStatus.VERIFIED_MATCH

    draft = build_dispute_email_draft(payload, po, triggered_rules, variance, po_baseline, sha256_hash)
    dispute_memo = draft.body if draft else None

    return InvoiceAuditRecord(
        id=inv_id,
        invoice_number=payload.get("invoice_number", "UNKNOWN"),
        vendor_name=payload.get("vendor_name", "Unknown Vendor"),
        vendor_ntn=payload.get("vendor_ntn", ""),
        vendor_email=payload.get("vendor_email", ""),
        bank_account_or_iban=payload.get("bank_account_or_iban", ""),
        invoice_date=payload.get("invoice_date", ""),
        due_date=payload.get("due_date", ""),
        po_reference=payload.get("po_reference", ""),
        currency=payload.get("currency", "USD"),
        subtotal=round(float(payload.get("subtotal", 0.0)), 2),
        tax_total=round(float(payload.get("tax_total", 0.0)), 2),
        discount_amount=round(float(payload.get("discount_amount", 0.0)), 2),
        grand_total=grand_total,
        po_baseline_grand_total=po_baseline,
        total_variance_amount=variance,
        status=status,
        confidence_score=conf,
        sha256_hash=sha256_hash,
        file_name=file_name,
        line_items=payload.get("line_items", []),
        rule_evaluations=rules,
        dispute_memo=dispute_memo,
    )
