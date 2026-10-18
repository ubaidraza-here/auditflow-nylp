"""In-Memory and Local JSON Persistent Ledger for AuditFlow.

Maintains:
- Active Purchase Orders
- Audited Invoices Ledger
- Immutable Compliance Audit Logs
- Immutable Seed Blueprint for clean demo resets
- Thread-safe operations
"""

import copy
import threading
from typing import Dict, List, Optional, Any
from app.data.seed_data import (
    INITIAL_SEED_INVOICES,
    INITIAL_SEED_PURCHASE_ORDERS,
    INITIAL_SEED_AUDIT_LOGS,
    get_initial_seed_invoices,
    get_initial_seed_purchase_orders,
    get_initial_seed_audit_logs,
)



class Database:
    """Thread-safe ledger store for AuditFlow."""

    def __init__(self):
        self._lock = threading.Lock()
        self._invoices: List[Dict[str, Any]] = get_initial_seed_invoices()
        self._purchase_orders: List[Dict[str, Any]] = get_initial_seed_purchase_orders()
        self._audit_logs: List[Dict[str, Any]] = get_initial_seed_audit_logs()

    # -------------------------------------------------------------------------
    # Invoices
    # -------------------------------------------------------------------------
    def get_all_invoices(self) -> List[Dict[str, Any]]:
        """Return shallow copies of all current invoices."""
        with self._lock:
            return [dict(inv) for inv in self._invoices]

    def get_invoice_by_id_or_number(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Find an invoice by either its invoice_id (e.g. inv_1002) or invoice_number (e.g. INV-9042)."""
        identifier_clean = identifier.strip().lower()
        with self._lock:
            for inv in self._invoices:
                if (
                    inv.get("invoice_id", "").lower() == identifier_clean
                    or inv.get("invoice_number", "").lower() == identifier_clean
                ):
                    return copy.deepcopy(inv)
        return None

    def upsert_invoice(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update an invoice in the ledger."""
        inv_id = invoice_data.get("invoice_id")

        with self._lock:
            if inv_id:
                for idx, inv in enumerate(self._invoices):
                    if inv.get("invoice_id") == inv_id:
                        self._invoices[idx] = copy.deepcopy(invoice_data)
                        return copy.deepcopy(invoice_data)
            else:
                inv_num = invoice_data.get("invoice_number")
                if inv_num:
                    for idx, inv in enumerate(self._invoices):
                        if inv.get("invoice_number") == inv_num:
                            self._invoices[idx] = copy.deepcopy(invoice_data)
                            return copy.deepcopy(invoice_data)

            # Not found -> insert at beginning
            self._invoices.insert(0, copy.deepcopy(invoice_data))
            return copy.deepcopy(invoice_data)

    def reset_invoice(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Reset a specific invoice to its original pristine state from the blueprint."""
        identifier_clean = identifier.strip().lower()
        blueprint = get_initial_seed_invoices()

        match = None
        for inv in blueprint:
            if (
                inv.get("invoice_id", "").lower() == identifier_clean
                or inv.get("invoice_number", "").lower() == identifier_clean
            ):
                match = inv
                break

        if not match:
            # Fallback to first invoice in blueprint if not found
            match = blueprint[0]

        fresh = copy.deepcopy(match)
        if "decision_metadata" in fresh:
            del fresh["decision_metadata"]

        with self._lock:
            updated = False
            for idx, inv in enumerate(self._invoices):
                if (
                    inv.get("invoice_id") == fresh.get("invoice_id")
                    or inv.get("invoice_number") == fresh.get("invoice_number")
                ):
                    self._invoices[idx] = fresh
                    updated = True
                    break
            if not updated:
                self._invoices.insert(0, fresh)

        return copy.deepcopy(fresh)

    # -------------------------------------------------------------------------
    # Purchase Orders
    # -------------------------------------------------------------------------
    def get_all_purchase_orders(self) -> List[Dict[str, Any]]:
        """Return all active Purchase Orders."""
        with self._lock:
            return copy.deepcopy(self._purchase_orders)

    def get_purchase_order(self, po_number: str) -> Optional[Dict[str, Any]]:
        """Find a Purchase Order by its PO number."""
        po_clean = po_number.strip().upper()
        with self._lock:
            for po in self._purchase_orders:
                if po.get("po_number", "").upper() == po_clean:
                    return copy.deepcopy(po)
        return None

    # -------------------------------------------------------------------------
    # Audit Logs
    # -------------------------------------------------------------------------
    def get_all_audit_logs(self) -> List[Dict[str, Any]]:
        """Return all chronological audit logs, newest first."""
        with self._lock:
            return copy.deepcopy(self._audit_logs)

    def add_audit_log(self, log_entry: Dict[str, Any]) -> Dict[str, Any]:
        """Prepend an immutable log entry to the ledger."""
        entry = copy.deepcopy(log_entry)
        with self._lock:
            self._audit_logs.insert(0, entry)
        return entry

    # -------------------------------------------------------------------------
    # Dynamic KPI Computation
    # -------------------------------------------------------------------------
    def compute_kpis(self) -> Dict[str, Any]:
        """Dynamically compute top-level Accounts Payable KPIs based on current ledger state."""
        with self._lock:
            invoices = self._invoices

            # Card 01: Audited Gross Volume = exact sum of billed_amount / grand_total of all invoices
            total_audited_volume = round(
                sum(float(inv.get("grand_total") or inv.get("billed_amount") or 0.0) for inv in invoices),
                2
            )

            # Card 03: Pending Exceptions Count = count of unresolved EXCEPTION_FLAGGED / NEEDS_REVIEW invoices
            flagged_invoices = [
                inv for inv in invoices
                if inv.get("status") in ("EXCEPTION_FLAGGED", "NEEDS_REVIEW", "FLAGGED")
            ]
            pending_exceptions_count = len(flagged_invoices)

            # Card 02: Prevented Financial Leakage = sum of financial_impact / overcharge variances across all flagged invoices
            prevented_leakage_amount = 0.0
            for inv in flagged_invoices:
                discrepancies = inv.get("discrepancies") or []
                if discrepancies:
                    disc_sum = sum(
                        float(d.get("financial_impact") or d.get("variance_amount") or 0.0)
                        for d in discrepancies
                    )
                    if disc_sum > 0:
                        prevented_leakage_amount += disc_sum
                        continue
                if inv.get("total_variance_amount") is not None and float(inv.get("total_variance_amount", 0.0)) > 0:
                    prevented_leakage_amount += float(inv.get("total_variance_amount"))
                    continue
                billed = float(inv.get("grand_total") or inv.get("billed_amount") or 0.0)
                po_auth = float(
                    (inv.get("matched_purchase_order") or {}).get("authorized_total")
                    or inv.get("po_baseline_grand_total")
                    or billed
                )
                prevented_leakage_amount += max(0.0, billed - po_auth)

            prevented_leakage_amount = round(prevented_leakage_amount, 2)

            # Card 04: Zero-Touch Match Rate = (verified_clean_count / total_count) * 100
            clean_invoices_count = sum(
                1
                for inv in invoices
                if inv.get("status") in ("VERIFIED_MATCH", "MATCHED_APPROVED", "APPROVED", "AUTO_APPROVED")
            )
            total_count = len(invoices)
            clean_match_rate_percent = (
                round((clean_invoices_count / total_count) * 100.0, 1)
                if total_count > 0
                else 0.0
            )

            return {
                "total_audited_volume": total_audited_volume,
                "prevented_leakage_amount": prevented_leakage_amount,
                "pending_exceptions_count": pending_exceptions_count,
                "clean_match_rate_percent": clean_match_rate_percent,
            }

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Return the combined dynamic KPIs and invoice queue."""
        kpis = self.compute_kpis()
        invoices = self.get_all_invoices()
        return {
            "kpis": kpis,
            "invoices": invoices,
        }

    # -------------------------------------------------------------------------
    # Complete Reset
    # -------------------------------------------------------------------------
    def reset_all(self):
        """Reset the entire database to the initial seed state."""
        with self._lock:
            self._invoices = get_initial_seed_invoices()
            self._purchase_orders = get_initial_seed_purchase_orders()
            self._audit_logs = get_initial_seed_audit_logs()


# Singleton database instance
db = Database()
