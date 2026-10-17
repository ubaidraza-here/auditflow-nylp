"""Automated Vendor Dispute & Credit Memo Notice Generator."""

from typing import List, Optional
from app.models.schemas import DisputeEmailDraft, DiscrepancyItem


def build_dispute_email_draft(
    extracted_data: dict,
    po: Optional[dict],
    discrepancies: List[DiscrepancyItem],
    total_variance_amount: float,
    po_baseline_total: float,
    sha256_hash: str,
) -> Optional[DisputeEmailDraft]:
    active_discs = [d for d in discrepancies if d.triggered]
    if not active_discs and total_variance_amount <= 0.0:
        return None

    vendor_name = extracted_data.get("vendor_name", "Vendor")
    inv_num = extracted_data.get("invoice_number", "UNKNOWN")
    po_ref = extracted_data.get("po_reference") or (po.get("po_number") if po else "UNREFERENCED")
    inv_date = extracted_data.get("invoice_date", "recent")
    recipient = (po and po.get("vendor_email")) or extracted_data.get("vendor_email") or f"billing@{vendor_name.lower().replace(' ', '')}.com"

    bullet_lines = []
    for d in active_discs:
        sev = d.severity.value if hasattr(d.severity, "value") else str(d.severity)
        line_ref = f"Line {d.affected_line_number}: " if d.affected_line_number else ""
        var_ref = f" (+${d.variance_amount:,.2f} USD variance)" if d.variance_amount > 0 else ""
        bullet_lines.append(f"- [{sev}] {line_ref}{d.rule_name} — {d.message}{var_ref}")

    bullet_text = "\n".join(bullet_lines) if bullet_lines else "- General invoice policy compliance variance."
    hash_short = f"{sha256_hash[:16]}..." if sha256_hash else "AUDITFLOW-RECORD"

    body = f"""Dear Accounts Payable & Billing Team at {vendor_name},

Following automated 3-way forensic reconciliation between Purchase Order {po_ref} and Tax Invoice #{inv_num} (dated {inv_date}), disbursement has been placed on administrative hold due to contracted cost variances totaling +${total_variance_amount:,.2f} USD:

{bullet_text}

In accordance with our enterprise vendor agreement and zero-variance disbursement policy:
1. Payment under Net 30 terms is hereby suspended pending resolution.
2. Please provide an amended tax invoice reflecting the authorized baseline of ${po_baseline_total:,.2f} USD, or issue a formal Credit Memorandum for ${total_variance_amount:,.2f} USD within 5 business days.

Sincerely,
Corporate Accounts Payable & Disbursement Governance
AuditFlow Cryptographic Ledger Reference: {hash_short}"""

    return DisputeEmailDraft(
        recipient_email=recipient,
        subject=f"Formal Notice: Billing Discrepancy & Disbursement Hold — Invoice #{inv_num} / PO {po_ref}",
        body=body.strip(),
        credit_memo_amount_requested=round(max(0.0, total_variance_amount), 2),
        invoice_number=inv_num,
        po_reference=po_ref,
    )
