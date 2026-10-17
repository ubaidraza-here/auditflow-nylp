"""Deterministic 7-Rule Discrepancy Auditor Rule Functions."""

import re
from typing import Dict, List, Optional, Tuple
from app.models.enums import RuleSeverity
from app.models.schemas import DiscrepancyItem


def normalize_inv_number(inv_str: str) -> str:
    s = inv_str.upper()
    for suffix in ["-REV", "-COPY", "-V2", "-V1", "_COPY", "_REV", "-DUPLICATE"]:
        s = s.replace(suffix, "")
    return re.sub(r"[\s\-_/]", "", s)


def normalize_account_str(val: str) -> str:
    return re.sub(r"[\s\-_]", "", (val or "").upper())


def check_exact_duplicate(sha256: str, ledger_invoices: List[dict], current_id: Optional[str]) -> Optional[DiscrepancyItem]:
    for inv in ledger_invoices:
        if inv.get("id") != current_id and inv.get("sha256_hash") == sha256:
            return DiscrepancyItem(
                rule_code="EXACT_FILE_DUPLICATE",
                rule_name="Exact File SHA-256 Collision",
                severity=RuleSeverity.CRITICAL,
                triggered=True,
                message=f"Binary digest matches previously registered invoice {inv['invoice_number']} ({inv['id']}).",
                variance_amount=round(inv.get("grand_total", 0.0), 2),
            )
    return None


def check_fuzzy_duplicate(current_inv: dict, ledger_invoices: List[dict], current_id: Optional[str]) -> Optional[DiscrepancyItem]:
    c_num = normalize_inv_number(current_inv.get("invoice_number", ""))
    c_vendor = (current_inv.get("vendor_name") or "").lower().strip()
    c_total = float(current_inv.get("grand_total", 0.0))

    for inv in ledger_invoices:
        if inv.get("id") == current_id:
            continue
        if inv.get("status") in ["APPROVED_CLEAN", "APPROVED_WITH_OVERRIDE", "VERIFIED_MATCH"]:
            same_vendor = (inv.get("vendor_name") or "").lower().strip() == c_vendor
            same_num = normalize_inv_number(inv.get("invoice_number", "")) == c_num
            same_total = abs(float(inv.get("grand_total", 0.0)) - c_total) < 0.02
            if same_vendor and same_num and same_total:
                return DiscrepancyItem(
                    rule_code="CRITICAL_FUZZY_DUPLICATE",
                    rule_name="Fuzzy Duplicate Suffix Detected",
                    severity=RuleSeverity.CRITICAL,
                    triggered=True,
                    message=f"Identical vendor, amount, and core invoice number to settled {inv['invoice_number']} ({inv['id']}).",
                    variance_amount=c_total,
                )
    return None


def check_internal_math(line_items: List[dict], subtotal: float, tax: float, discount: float, grand: float) -> List[DiscrepancyItem]:
    items: List[DiscrepancyItem] = []
    calc_subtotal = 0.0
    for l in line_items:
        qty = float(l.get("quantity", 0.0))
        rate = float(l.get("unit_price", 0.0))
        billed = float(l.get("line_total", 0.0))
        calc_subtotal += billed
        if abs(round(qty * rate, 2) - billed) > 0.02:
            items.append(DiscrepancyItem(
                rule_code="INTERNAL_MATH_ERROR",
                rule_name="Line Math Calculation Error",
                severity=RuleSeverity.CRITICAL,
                triggered=True,
                message=f"Line {l.get('line_number')} math error: {qty} * ${rate:.2f} != ${billed:.2f}.",
                variance_amount=round(abs(round(qty * rate, 2) - billed), 2),
                affected_line_number=l.get("line_number"),
            ))
    calc_grand = round(calc_subtotal + tax - discount, 2)
    if abs(calc_grand - round(grand, 2)) > 0.02:
        items.append(DiscrepancyItem(
            rule_code="INTERNAL_MATH_ERROR",
            rule_name="Grand Total Summation Mismatch",
            severity=RuleSeverity.CRITICAL,
            triggered=True,
            message=f"Grand total recomputation mismatch: calculated ${calc_grand:.2f} vs billed ${grand:.2f}.",
            variance_amount=round(abs(calc_grand - round(grand, 2)), 2),
        ))
    return items


def check_bank_mismatch(extracted_iban: str, po_iban: str) -> Optional[DiscrepancyItem]:
    e_clean = normalize_account_str(extracted_iban)
    p_clean = normalize_account_str(po_iban)
    if e_clean and p_clean and e_clean != p_clean:
        return DiscrepancyItem(
            rule_code="BANK_ACCOUNT_MISMATCH",
            rule_name="Bank Account / IBAN Diversion Mismatch",
            severity=RuleSeverity.CRITICAL,
            triggered=True,
            message=f"Extracted bank/IBAN ({extracted_iban}) does not match contracted ERP baseline ({po_iban}).",
            variance_amount=0.0,
        )
    return None


def reconcile_line_item(l: dict, po_lines: Dict[str, dict]) -> Tuple[List[DiscrepancyItem], str]:
    matched_id = l.get("matched_po_line_id")
    if not matched_id or matched_id not in po_lines:
        sev = RuleSeverity.WARNING if float(l.get("line_total", 0.0)) < 25.0 else RuleSeverity.HIGH
        return [DiscrepancyItem(
            rule_code="UNAPPROVED_LINE_ITEM",
            rule_name="Unapproved Line Item Surcharge",
            severity=sev,
            triggered=True,
            message=f"Line {l.get('line_number')} ('{l.get('description')}') is not authorized in PO.",
            variance_amount=round(float(l.get("line_total", 0.0)), 2),
            affected_line_number=l.get("line_number"),
        )], "UNAPPROVED_ITEM"

    po_l = po_lines[matched_id]
    discs: List[DiscrepancyItem] = []
    line_status = "MATCH"
    b_rate = float(l.get("unit_price", 0.0))
    p_rate = float(po_l.get("unit_price", 0.0))
    b_qty = float(l.get("quantity", 0.0))
    p_qty = float(po_l.get("quantity", 0.0))

    if b_rate - p_rate > 0.005:
        discs.append(DiscrepancyItem(
            rule_code="UNIT_PRICE_OVERCHARGE",
            rule_name="Contracted Unit Price Overcharge",
            severity=RuleSeverity.CRITICAL,
            triggered=True,
            message=f"Line {l.get('line_number')} unit price (${b_rate:.2f}) exceeds PO (${p_rate:.2f}) by ${b_rate - p_rate:.2f}/unit.",
            variance_amount=round((b_rate - p_rate) * b_qty, 2),
            affected_line_number=l.get("line_number"),
        ))
        line_status = "OVERCHARGE"

    if b_qty - p_qty > 0.001:
        discs.append(DiscrepancyItem(
            rule_code="QUANTITY_EXCEEDED",
            rule_name="Authorized Purchase Order Quantity Exceeded",
            severity=RuleSeverity.HIGH,
            triggered=True,
            message=f"Line {l.get('line_number')} billed quantity ({b_qty}) exceeds authorized PO quantity ({p_qty}).",
            variance_amount=round((b_qty - p_qty) * p_rate, 2),
            affected_line_number=l.get("line_number"),
        ))
        line_status = "QUANTITY_MISMATCH" if line_status == "MATCH" else line_status

    return discs, line_status
