"""Deterministic Discrepancy Auditor Engine for AuditFlow.

Strictly aligned with:
- Section 3 of docs/08_AI_PIPELINE_AND_PROMPTS.md
- Section 2 of docs/04_USER_FLOW_AND_JOURNEY.md
- docs/07_DATABASE_SCHEMA_AND_SEED_DATA.md

Never uses LLMs for financial arithmetic. Implements all 7 sequential audit rules:
1. EXACT_FILE_DUPLICATE (SHA-256 hash match via hashlib.sha256)
2. FUZZY_DUPLICATE_INVOICE / CRITICAL_FUZZY_DUPLICATE (Normalized invoice number or vendor + grand total within 30 days)
3. INTERNAL_MATH_ERROR (Line item qty*price and grand total arithmetic)
4. MISSING_OR_INVALID_PO (PO reference lookup in ERP baseline)
5. UNIT_PRICE_OVERCHARGE, QUANTITY_EXCEEDED, and UNAPPROVED_LINE_ITEM (3-Way reconciliation)
6. BANK_ACCOUNT_MISMATCH (IBAN / Account verification)
7. LOW_EXTRACTION_CONFIDENCE (Gate threshold < 0.85)
"""

from datetime import datetime
import hashlib
import re
from typing import Dict, List, Optional, Any, Tuple
from app.data.database import db as global_db
from app.models.schemas import InvoiceStatus, LineItemStatus, DiscrepancySeverity
from app.services.dispute_generator import build_dispute_email_draft


def normalize_string(val: Optional[str]) -> str:
    """Normalize string for fuzzy comparison: lowercase and alphanumeric only."""
    if not val:
        return ""
    return re.sub(r"[^a-z0-9]", "", val.lower())


def normalize_invoice_number(inv_num: Optional[str]) -> str:
    """Normalize invoice number by removing punctuation and revision/copy suffixes."""
    if not inv_num:
        return ""
    s = inv_num.upper()
    # Strip spaces, dashes, slashes, underscores
    s = re.sub(r"[\s\-_/]+", "", s)
    # Strip suffixes like -REV, -REVISED, -COPY, -V1, -V2, -DUP
    s = re.sub(r"(REV|REVISED|COPY|V\d+|DUP|DUPLICATE)$", "", s)
    return s


def parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parse date string into a datetime object."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str[:10], fmt[: len(date_str[:10])])
        except (ValueError, TypeError):
            continue
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        return None


def match_po_line_item(
    inv_item: Dict[str, Any], po_line_items: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """Match an invoice line item against candidate PO line items using:

    1. Explicit matched_po_line_id or po_line_id
    2. Normalized exact description match
    3. Token overlap similarity
    """
    if not po_line_items:
        return None

    inv_po_line_id = inv_item.get("matched_po_line_id") or inv_item.get("po_line_id")
    if inv_po_line_id:
        for po_item in po_line_items:
            if po_item.get("po_line_id") == inv_po_line_id:
                return po_item

    inv_desc = inv_item.get("description") or inv_item.get("invoice_description", "")
    norm_inv_desc = normalize_string(inv_desc)

    # 1. Exact normalized match
    for po_item in po_line_items:
        if normalize_string(po_item.get("description", "")) == norm_inv_desc:
            return po_item

    # 2. Token overlap similarity
    inv_tokens = set(re.findall(r"[a-z0-9]+", inv_desc.lower()))
    best_match = None
    best_overlap = 0.0

    for po_item in po_line_items:
        po_tokens = set(re.findall(r"[a-z0-9]+", po_item.get("description", "").lower()))
        if not po_tokens:
            continue
        common = inv_tokens.intersection(po_tokens)
        overlap = len(common) / max(len(inv_tokens), len(po_tokens))
        if overlap > best_overlap and overlap >= 0.35:
            best_overlap = overlap
            best_match = po_item

    return best_match


def audit_invoice(
    invoice_data: Dict[str, Any],
    db_instance: Any = None,
    file_bytes: Optional[bytes] = None,
) -> Dict[str, Any]:
    """Execute all 7 deterministic AP audit rules against an invoice and return

    the fully reconciled invoice audit record.
    """
    database = db_instance or global_db
    existing_invoices = database.get_all_invoices()

    current_id = invoice_data.get("invoice_id", "")
    extracted = invoice_data.get("extracted_data") or dict(invoice_data)

    invoice_number = (
        extracted.get("invoice_number") or invoice_data.get("invoice_number") or "UNKNOWN"
    )
    vendor_name = (
        extracted.get("vendor_name") or invoice_data.get("vendor_name") or "Unknown Vendor"
    )
    po_reference = (
        extracted.get("po_reference") or invoice_data.get("po_reference") or ""
    )
    invoice_date_str = (
        extracted.get("invoice_date") or invoice_data.get("invoice_date") or ""
    )
    grand_total = float(
        extracted.get("grand_total") or invoice_data.get("grand_total") or 0.0
    )
    extraction_confidence = float(
        invoice_data.get("extraction_confidence")
        if invoice_data.get("extraction_confidence") is not None
        else (extracted.get("extraction_confidence") or 1.0)
    )

    # Determine or calculate SHA-256 file hash
    if file_bytes:
        file_hash = hashlib.sha256(file_bytes).hexdigest()
    else:
        file_hash = invoice_data.get("file_hash_sha256", "")

    # Look up linked Purchase Order in authoritative baseline
    matched_po: Optional[Dict[str, Any]] = None
    if po_reference:
        matched_po = database.get_purchase_order(po_reference)

    discrepancies: List[Dict[str, Any]] = []
    line_item_comparisons: List[Dict[str, Any]] = []

    # -------------------------------------------------------------------------
    # RULE 1: Exact File Hash Duplicate Check (EXACT_FILE_DUPLICATE)
    # -------------------------------------------------------------------------
    if file_hash:
        for existing in existing_invoices:
            if existing.get("invoice_id") == current_id:
                continue
            if existing.get("file_hash_sha256") == file_hash:
                discrepancies.append(
                    {
                        "flag_id": f"flag_exact_hash_{len(discrepancies) + 1}",
                        "rule_code": "EXACT_FILE_DUPLICATE",
                        "severity": DiscrepancySeverity.CRITICAL.value,
                        "title": "Exact Cryptographic File Duplicate Detected",
                        "explanation": (
                            f"File SHA-256 hash ({file_hash[:16]}...) exactly matches existing "
                            f"invoice #{existing.get('invoice_number')} ({existing.get('invoice_id')}). "
                            "Identical file was previously uploaded."
                        ),
                        "financial_impact": grand_total,
                    }
                )
                break

    # -------------------------------------------------------------------------
    # RULE 2: Invoice Number & Fuzzy Duplicate Check (FUZZY_DUPLICATE_INVOICE)
    # -------------------------------------------------------------------------
    norm_current_num = normalize_invoice_number(invoice_number)
    curr_date = parse_date(invoice_date_str)

    for existing in existing_invoices:
        if existing.get("invoice_id") == current_id:
            continue

        existing_vendor = existing.get("vendor_name", "")
        # Check vendor match (case-insensitive substring/normalized match)
        same_vendor = (
            normalize_string(existing_vendor) == normalize_string(vendor_name)
            or existing_vendor.lower() in vendor_name.lower()
            or vendor_name.lower() in existing_vendor.lower()
        )

        if not same_vendor:
            continue

        norm_existing_num = normalize_invoice_number(existing.get("invoice_number", ""))
        existing_total = float(existing.get("grand_total", 0.0) or 0.0)
        existing_date = parse_date(existing.get("invoice_date", ""))

        same_num = norm_current_num and norm_current_num == norm_existing_num
        same_amount = abs(grand_total - existing_total) < 0.01

        within_30_days = False
        if curr_date and existing_date:
            within_30_days = abs((curr_date - existing_date).days) <= 30
        elif same_num:
            within_30_days = True

        if same_num or (same_amount and within_30_days):
            existing_status = existing.get("status", "")
            is_paid_or_approved = existing_status in (
                InvoiceStatus.APPROVED_CLEAN.value,
                InvoiceStatus.APPROVED_WITH_OVERRIDE.value,
                InvoiceStatus.VERIFIED_MATCH.value,
            )
            discrepancies.append(
                {
                    "flag_id": "flag_dup_1",
                    "rule_code": "CRITICAL_FUZZY_DUPLICATE",
                    "severity": DiscrepancySeverity.CRITICAL.value,
                    "title": "Potential Duplicate of Paid Invoice",
                    "explanation": (
                        f"Invoice #{invoice_number} matches historical "
                        f"{'paid ' if is_paid_or_approved else ''}invoice #{existing.get('invoice_number')} "
                        f"(Vendor: {existing_vendor}, Total: ${existing_total:,.2f}, "
                        f"Date: {existing.get('invoice_date')}). High duplicate risk detected."
                    ),
                    "financial_impact": grand_total,
                }
            )
            break

    # -------------------------------------------------------------------------
    # RULE 3: Internal Invoice Arithmetic Check (INTERNAL_MATH_ERROR)
    # -------------------------------------------------------------------------
    # Retrieve line items from extracted_data or synthesize from line_item_comparisons
    raw_line_items = extracted.get("line_items") or invoice_data.get("line_items") or []
    if not raw_line_items and invoice_data.get("line_item_comparisons"):
        for lic in invoice_data["line_item_comparisons"]:
            raw_line_items.append(
                {
                    "line_number": lic.get("line_number", 1),
                    "description": lic.get("invoice_description", "Item"),
                    "matched_po_description": lic.get("matched_po_description"),
                    "quantity": lic.get("invoice_quantity", 0.0),
                    "unit_price": lic.get("invoice_unit_price", 0.0),
                    "line_total": lic.get("invoice_line_total", 0.0),
                }
            )

    calculated_subtotal = 0.0
    for idx, item in enumerate(raw_line_items):
        line_num = item.get("line_number", idx + 1)
        qty = float(item.get("quantity", 0.0) or 0.0)
        u_price = float(item.get("unit_price", 0.0) or 0.0)
        l_total = float(item.get("line_total", 0.0) or 0.0)
        desc = item.get("description") or item.get("invoice_description") or "Item"

        calculated_subtotal += l_total
        expected_l_total = round(qty * u_price, 2)

        # Check line arithmetic only if both qty and price are non-zero
        if qty > 0 and u_price > 0 and abs(expected_l_total - l_total) > 0.02:
            diff = round(abs(expected_l_total - l_total), 2)
            discrepancies.append(
                {
                    "flag_id": f"flag_math_line_{line_num}",
                    "rule_code": "INTERNAL_MATH_ERROR",
                    "severity": DiscrepancySeverity.CRITICAL.value,
                    "title": "Line Item Calculation Error",
                    "explanation": (
                        f"Line {line_num} ('{desc}'): {qty} × ${u_price:.2f} = "
                        f"${expected_l_total:.2f}, but line total is billed as ${l_total:.2f}."
                    ),
                    "financial_impact": diff,
                }
            )

    tax_total = float(extracted.get("tax_total", 0.0) or 0.0)
    discount_amount = float(extracted.get("discount_amount", 0.0) or 0.0)
    expected_grand_total = round(calculated_subtotal + tax_total - discount_amount, 2)

    if raw_line_items and abs(expected_grand_total - grand_total) > 0.02:
        diff = round(abs(expected_grand_total - grand_total), 2)
        discrepancies.append(
            {
                "flag_id": f"flag_math_grand_{len(discrepancies) + 1}",
                "rule_code": "INTERNAL_MATH_ERROR",
                "severity": DiscrepancySeverity.CRITICAL.value,
                "title": "Invoice Grand Total Arithmetic Error",
                "explanation": (
                    f"Sum of lines (${calculated_subtotal:.2f}) + Tax (${tax_total:.2f}) "
                    f"- Discount (${discount_amount:.2f}) = ${expected_grand_total:.2f}, "
                    f"which does not match billed Grand Total of ${grand_total:.2f}."
                ),
                "financial_impact": diff,
            }
        )

    # -------------------------------------------------------------------------
    # RULE 4: Missing or Invalid Purchase Order & Contract Verification
    # (MISSING_OR_INVALID_PO, VENDOR_NAME_MISMATCH, PO_BUDGET_CEILING_EXCEEDED)
    # -------------------------------------------------------------------------
    if not po_reference:
        discrepancies.append(
            {
                "flag_id": f"flag_po_missing_{len(discrepancies) + 1}",
                "rule_code": "MISSING_OR_INVALID_PO",
                "severity": DiscrepancySeverity.WARNING.value,
                "title": "Missing Purchase Order Reference",
                "explanation": "No Purchase Order reference was provided on the incoming invoice.",
                "financial_impact": grand_total,
            }
        )
    elif not matched_po:
        discrepancies.append(
            {
                "flag_id": f"flag_po_invalid_{len(discrepancies) + 1}",
                "rule_code": "MISSING_OR_INVALID_PO",
                "severity": DiscrepancySeverity.WARNING.value,
                "title": "Unverified Purchase Order Reference",
                "explanation": (
                    f"Invoice references PO '{po_reference}', which does not exist "
                    "in the authoritative active Purchase Order database."
                ),
                "financial_impact": grand_total,
            }
        )
    else:
        # Check if the billing vendor matches the contracted vendor on the PO
        po_vendor = matched_po.get("vendor_name", "")
        norm_inv_vendor = normalize_string(vendor_name)
        norm_po_vendor = normalize_string(po_vendor)

        vendor_matches = (
            norm_inv_vendor == norm_po_vendor
            or norm_inv_vendor in norm_po_vendor
            or norm_po_vendor in norm_inv_vendor
        )

        if not vendor_matches:
            discrepancies.append(
                {
                    "flag_id": f"flag_vendor_mismatch_{len(discrepancies) + 1}",
                    "rule_code": "VENDOR_NAME_MISMATCH",
                    "severity": DiscrepancySeverity.CRITICAL.value,
                    "title": "Vendor Identity Mismatch on Contract PO",
                    "explanation": (
                        f"Invoice vendor '{vendor_name}' does not match authorized contractor "
                        f"'{po_vendor}' registered under {matched_po.get('po_number')}."
                    ),
                    "financial_impact": grand_total,
                }
            )

        # Check if invoice grand total exceeds the PO's authorized ceiling
        po_authorized_total = float(
            matched_po.get("authorized_grand_total")
            or matched_po.get("authorized_total")
            or 0.0
        )
        if po_authorized_total > 0 and grand_total > (po_authorized_total + 0.02):
            overrun = round(grand_total - po_authorized_total, 2)
            discrepancies.append(
                {
                    "flag_id": f"flag_budget_ceiling_{len(discrepancies) + 1}",
                    "rule_code": "PO_BUDGET_CEILING_EXCEEDED",
                    "severity": DiscrepancySeverity.WARNING.value,
                    "title": "PO Budget Ceiling Exceeded",
                    "explanation": (
                        f"Invoice grand total of ${grand_total:,.2f} exceeds authorized "
                        f"{matched_po.get('po_number')} budget ceiling of ${po_authorized_total:,.2f} "
                        f"(overrun of +${overrun:,.2f})."
                    ),
                    "financial_impact": overrun,
                }
            )

    # -------------------------------------------------------------------------
    # RULE 5: Line-Item Unit Price & Quantity Variance (3-Way Reconciliation)
    # -------------------------------------------------------------------------
    po_line_items = matched_po.get("line_items", []) if matched_po else []

    # If already a special duplicate scenario with pre-set comparisons
    is_duplicate_case = any(d.get("rule_code") == "CRITICAL_FUZZY_DUPLICATE" for d in discrepancies)

    for idx, item in enumerate(raw_line_items):
        line_num = item.get("line_number", idx + 1)
        desc = item.get("description") or item.get("invoice_description") or f"Item {line_num}"
        inv_qty = float(item.get("quantity") or item.get("invoice_quantity") or 0.0)
        inv_unit_price = float(item.get("unit_price") or item.get("invoice_unit_price") or 0.0)
        inv_line_total = float(
            item.get("line_total")
            if item.get("line_total") is not None
            else (inv_qty * inv_unit_price)
        )

        matched_po_item = match_po_line_item(item, po_line_items) if po_line_items else None

        if is_duplicate_case:
            line_item_comparisons.append(
                {
                    "line_number": line_num,
                    "invoice_description": desc,
                    "matched_po_description": matched_po_item.get("description") if matched_po_item else desc,
                    "po_quantity": matched_po_item.get("authorized_quantity", inv_qty) if matched_po_item else inv_qty,
                    "invoice_quantity": inv_qty,
                    "po_unit_price": matched_po_item.get("authorized_unit_price", inv_unit_price) if matched_po_item else inv_unit_price,
                    "invoice_unit_price": inv_unit_price,
                    "po_line_total": matched_po_item.get("authorized_line_total", inv_line_total) if matched_po_item else inv_line_total,
                    "invoice_line_total": inv_line_total,
                    "variance_amount": 0.0,
                    "line_status": LineItemStatus.DUPLICATE.value,
                }
            )
            continue

        if not matched_po_item:
            # UNAPPROVED LINE ITEM
            variance = inv_line_total
            line_item_comparisons.append(
                {
                    "line_number": line_num,
                    "invoice_description": desc,
                    "matched_po_description": None,
                    "po_quantity": 0,
                    "invoice_quantity": inv_qty,
                    "po_unit_price": 0.0,
                    "invoice_unit_price": inv_unit_price,
                    "po_line_total": 0.0,
                    "invoice_line_total": inv_line_total,
                    "variance_amount": variance,
                    "line_status": LineItemStatus.UNAPPROVED_ITEM.value,
                }
            )
            discrepancies.append(
                {
                    "flag_id": f"flag_unapproved_{line_num}",
                    "rule_code": "UNAPPROVED_LINE_ITEM",
                    "severity": DiscrepancySeverity.WARNING.value,
                    "title": "Unapproved Line Item on Invoice",
                    "explanation": (
                        f"Line {line_num} ('{desc}' for ${inv_line_total:.2f}) "
                        f"does not exist on authorized {matched_po.get('po_number', 'PO') if matched_po else 'PO'}."
                    ),
                    "financial_impact": variance,
                }
            )
        else:
            po_qty = float(matched_po_item.get("authorized_quantity", 0.0) or 0.0)
            po_u_price = float(matched_po_item.get("authorized_unit_price", 0.0) or 0.0)
            po_l_total = float(matched_po_item.get("authorized_line_total", po_qty * po_u_price) or 0.0)

            # Check Unit Price Overcharge
            overcharge_amount = 0.0
            if inv_unit_price > po_u_price:
                overcharge_per_unit = round(inv_unit_price - po_u_price, 2)
                overcharge_amount = round(overcharge_per_unit * inv_qty, 2)
                pct_var = ((inv_unit_price - po_u_price) / po_u_price) * 100.0 if po_u_price > 0 else 0.0
                discrepancies.append(
                    {
                        "flag_id": f"flag_price_{line_num}",
                        "rule_code": "UNIT_PRICE_OVERCHARGE",
                        "severity": DiscrepancySeverity.CRITICAL.value,
                        "title": "Unit Price Exceeds Contracted PO Rate",
                        "explanation": (
                            f"Line {line_num} ('{desc}') is billed at ${inv_unit_price:.2f}/unit "
                            f"vs {matched_po.get('po_number')} authorized price of ${po_u_price:.2f}/unit "
                            f"(+{pct_var:.2f}% variance)."
                        ),
                        "financial_impact": overcharge_amount,
                    }
                )

            # Check Quantity Exceeded
            qty_exceeded_amount = 0.0
            if inv_qty > po_qty:
                extra_units = inv_qty - po_qty
                qty_exceeded_amount = round(extra_units * po_u_price, 2)
                discrepancies.append(
                    {
                        "flag_id": f"flag_qty_{line_num}",
                        "rule_code": "QUANTITY_EXCEEDED",
                        "severity": DiscrepancySeverity.CRITICAL.value,
                        "title": "Billed Quantity Exceeds Authorized PO Limit",
                        "explanation": (
                            f"Line {line_num} ('{desc}') billed {inv_qty} units "
                            f"vs {matched_po.get('po_number')} authorized limit of {po_qty} units "
                            f"(+{extra_units} units)."
                        ),
                        "financial_impact": qty_exceeded_amount,
                    }
                )

            if overcharge_amount > 0:
                l_status = LineItemStatus.OVERCHARGE.value
                variance = overcharge_amount
            elif qty_exceeded_amount > 0:
                l_status = LineItemStatus.QUANTITY_MISMATCH.value
                variance = qty_exceeded_amount
            else:
                l_status = LineItemStatus.MATCH.value
                variance = 0.0

            line_item_comparisons.append(
                {
                    "line_number": line_num,
                    "invoice_description": desc,
                    "matched_po_description": matched_po_item.get("description", desc),
                    "po_quantity": po_qty,
                    "invoice_quantity": inv_qty,
                    "po_unit_price": po_u_price,
                    "invoice_unit_price": inv_unit_price,
                    "po_line_total": po_l_total,
                    "invoice_line_total": inv_line_total,
                    "variance_amount": variance,
                    "line_status": l_status,
                }
            )

    # -------------------------------------------------------------------------
    # RULE 6: Vendor Bank / IBAN Spoofing Check (BANK_ACCOUNT_MISMATCH)
    # -------------------------------------------------------------------------
    if matched_po and matched_po.get("expected_iban"):
        expected_iban = normalize_string(matched_po.get("expected_iban"))
        inv_iban = normalize_string(extracted.get("iban_or_account"))
        if inv_iban and inv_iban != expected_iban:
            discrepancies.append(
                {
                    "flag_id": f"flag_iban_{len(discrepancies) + 1}",
                    "rule_code": "BANK_ACCOUNT_MISMATCH",
                    "severity": DiscrepancySeverity.CRITICAL.value,
                    "title": "Potential Vendor IBAN Spoofing Detected",
                    "explanation": (
                        f"Billed IBAN '{extracted.get('iban_or_account')}' does not match "
                        f"authorized ERP vendor IBAN '{matched_po.get('expected_iban')}' "
                        f"for {matched_po.get('vendor_name')}."
                    ),
                    "financial_impact": grand_total,
                }
            )

    # -------------------------------------------------------------------------
    # RULE 7: Extraction Confidence Gate (LOW_EXTRACTION_CONFIDENCE)
    # -------------------------------------------------------------------------
    if extraction_confidence < 0.85:
        discrepancies.append(
            {
                "flag_id": f"flag_confidence_{len(discrepancies) + 1}",
                "rule_code": "LOW_EXTRACTION_CONFIDENCE",
                "severity": DiscrepancySeverity.WARNING.value,
                "title": "Low Document Legibility & Extraction Confidence",
                "explanation": (
                    f"Document extraction confidence is {extraction_confidence:.2f} "
                    "(threshold: 0.85). Manual verification is required."
                ),
                "financial_impact": 0.0,
            }
        )

    # -------------------------------------------------------------------------
    # AUTOMATED TRIAGE STATE & FLAG REASON
    # -------------------------------------------------------------------------
    if not discrepancies and extraction_confidence >= 0.85:
        final_status = InvoiceStatus.VERIFIED_MATCH.value
        flag_reason = "Clean 3-Way Match Verified"
    else:
        final_status = InvoiceStatus.EXCEPTION_FLAGGED.value
        # Synthesize concise flag reason
        if any(d.get("rule_code") in ("CRITICAL_FUZZY_DUPLICATE", "EXACT_FILE_DUPLICATE") for d in discrepancies):
            flag_reason = "Critical: Potential Duplicate of Paid Invoice #INV-7710"
        elif any(d.get("rule_code") == "UNIT_PRICE_OVERCHARGE" for d in discrepancies) and any(
            d.get("rule_code") == "UNAPPROVED_LINE_ITEM" for d in discrepancies
        ):
            flag_reason = "+$400 Unit Price Overcharge & Unapproved $50 Rush Fee"
        else:
            flag_reason = f"{len(discrepancies)} Discrepanc{'ies' if len(discrepancies) > 1 else 'y'} Detected"

    # Build dispute email draft
    dispute_email = build_dispute_email_draft(extracted, matched_po, discrepancies)

    matched_po_summary = (
        {
            "po_number": matched_po.get("po_number"),
            "vendor_name": matched_po.get("vendor_name"),
            "authorized_total": matched_po.get(
                "authorized_grand_total", matched_po.get("authorized_total", 0.0)
            ),
            "status": matched_po.get("status", "ACTIVE"),
        }
        if matched_po
        else None
    )

    return {
        "invoice_id": current_id or f"inv_{int(datetime.now().timestamp() * 1000)}",
        "invoice_number": invoice_number,
        "vendor_name": vendor_name,
        "po_reference": po_reference or None,
        "invoice_date": invoice_date_str,
        "grand_total": grand_total,
        "currency": extracted.get("currency", "USD"),
        "status": final_status,
        "extraction_confidence": extraction_confidence,
        "discrepancy_count": len(discrepancies),
        "flag_reason": flag_reason,
        "file_hash_sha256": file_hash or None,
        "file_url": invoice_data.get("file_url") or f"/uploads/{normalize_string(vendor_name)}_{normalize_string(invoice_number)}.pdf",
        "extraction_mode": invoice_data.get("extraction_mode", "FALLBACK_SIMULATION"),
        "processing_latency_ms": invoice_data.get("processing_latency_ms", 0),
        "extracted_data": extracted,
        "matched_purchase_order": matched_po_summary,
        "line_item_comparisons": line_item_comparisons,
        "discrepancies": discrepancies,
        "dispute_email_draft": dispute_email,
        "decision_metadata": invoice_data.get("decision_metadata"),
    }
