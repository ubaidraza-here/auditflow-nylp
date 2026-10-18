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

# Historical baseline constants representing audited volume and leakage prior to active queue
BASE_HISTORICAL_VOLUME = 125350.0
BASE_HISTORICAL_LEAKAGE = 3870.5
BASE_HISTORICAL_CLEAN_COUNT = 43
BASE_HISTORICAL_TOTAL_COUNT = 54


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
            audit_logs = self._audit_logs

            # Total Audited Volume = historical baseline + sum of all current invoices
            invoices_volume = sum(float(inv.get("grand_total", 0.0) or 0.0) for inv in invoices)
            total_audited_volume = round(BASE_HISTORICAL_VOLUME + invoices_volume, 2)

            # Prevented Financial Leakage = historical baseline + sum of all saved impacts in audit logs
            logs_saved = sum(
                float(log.get("financial_impact_saved", 0.0) or 0.0) for log in audit_logs
            )
            prevented_leakage_amount = round(BASE_HISTORICAL_LEAKAGE + logs_saved, 2)

            # Pending Exceptions Count = invoices currently waiting for human audit
            pending_exceptions_count = sum(
                1 for inv in invoices if inv.get("status") == "EXCEPTION_FLAGGED"
            )

            # Clean Match Rate = percentage of clean match invoices (VERIFIED_MATCH or APPROVED_CLEAN)
            clean_invoices_count = sum(
                1
                for inv in invoices
                if inv.get("status") in ("VERIFIED_MATCH", "APPROVED_CLEAN")
            )
            total_count = BASE_HISTORICAL_TOTAL_COUNT + len(invoices)
            total_clean = BASE_HISTORICAL_CLEAN_COUNT + clean_invoices_count
            clean_match_rate_percent = (
                round((total_clean / total_count) * 100.0, 1) if total_count > 0 else 75.0
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
