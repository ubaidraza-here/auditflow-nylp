"""Automated Vendor Dispute Email Builder.

Strictly aligned with:
- docs/08_AI_PIPELINE_AND_PROMPTS.md (Section 4)
- docs/06_SYSTEM_ARCHITECTURE.md (Endpoint 2 & 3)
"""

from typing import Dict, List, Optional, Any


def build_dispute_email_draft(
    extracted_data: Dict[str, Any],
    po: Optional[Dict[str, Any]],
    discrepancies: List[Dict[str, Any]],
) -> Optional[Dict[str, str]]:
    """Build an institutional, vendor-specific dispute email draft detailing

    exact financial variances and discrepancy reasons. Returns None if there
    are zero discrepancies.
    """
    if not discrepancies:
        return None

    vendor_name = extracted_data.get("vendor_name") or (po.get("vendor_name") if po else "Vendor")
    recipient = extracted_data.get("vendor_email") or (po.get("vendor_email") if po else "billing@vendor.com")
    invoice_number = extracted_data.get("invoice_number", "UNKNOWN")
    invoice_date = extracted_data.get("invoice_date", "recent")
    po_reference = extracted_data.get("po_reference") or (po.get("po_number") if po else "No PO")
    grand_total = float(extracted_data.get("grand_total", 0.0) or 0.0)

    total_variance = sum(float(d.get("financial_impact", 0.0) or 0.0) for d in discrepancies)

    # Determine subject title based on discrepancy types
    has_duplicate = any(
        d.get("rule_code") in ("CRITICAL_FUZZY_DUPLICATE", "EXACT_FILE_DUPLICATE")
        for d in discrepancies
    )
    if has_duplicate:
        subject = f"DUPLICATE BILLING NOTICE: Invoice #{invoice_number} (Ref: {po_reference})"
    else:
        subject = f"DISCREPANCY NOTICE: Invoice #{invoice_number} (Ref: {po_reference})"

    # Format line-item discrepancy bullets
    bullet_lines = "\n".join(
        f"{idx + 1}. [{d.get('rule_code', 'FLAG')}] {d.get('title', 'Billing Issue')}: "
        f"{d.get('explanation', '')} (Disputed Variance: ${float(d.get('financial_impact', 0.0)):.2f})"
        for idx, d in enumerate(discrepancies)
    )

    # Authorized PO Grand Total Limit
    if po:
        po_auth = po.get("authorized_grand_total", po.get("authorized_total", 0.0))
        po_limit = f"${float(po_auth):.2f}"
    else:
        po_limit = "N/A (No Matching PO Found)"

    body = (
        f"Dear {vendor_name} Billing Team,\n\n"
        f"During our automated three-way reconciliation of Invoice #{invoice_number} "
        f"(dated {invoice_date}) for ${grand_total:.2f} against authorized baseline records, "
        f"our AuditFlow verification engine flagged the following billing discrepancies:\n\n"
        f"{bullet_lines}\n\n"
        f"Total Disputed Variance: ${total_variance:.2f}\n"
        f"Authorized Purchase Order Limit: {po_limit}\n\n"
        f"Please cancel invoice #{invoice_number} and issue a revised invoice or credit note "
        f"reflecting the contracted rates so payment can be released immediately.\n\n"
        f"Regards,\n"
        f"Accounts Payable Audit Team\n"
        f"AuditFlow Institutional Compliance"
    )

    return {
        "recipient": recipient,
        "subject": subject,
        "body": body,
    }
