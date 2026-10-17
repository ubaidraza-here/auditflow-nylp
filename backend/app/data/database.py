"""Thread-safe In-Memory ERP & Invoice Ledger with Deepcopy Re-Seed."""

import copy
import threading
from typing import Dict, List, Optional
from app.data.seed_data import (
    SEED_PURCHASE_ORDERS,
    SEED_INVOICES,
    SEED_AUDIT_LOGS,
)

BASE_PORTFOLIO_VOLUME = 125350.00
BASE_PREVENTED_LEAKAGE = 1070.50
BASE_CLEAN_COUNT = 16
BASE_RESOLVED_COUNT = 20


class InMemoryLedger:
    def __init__(self):
        self._lock = threading.Lock()
        self.reset()

    def reset(self):
        with self._lock:
            self.purchase_orders: List[dict] = copy.deepcopy(SEED_PURCHASE_ORDERS)
            self.invoices: Dict[str, dict] = {
                inv["id"]: copy.deepcopy(inv) for inv in SEED_INVOICES
            }
            self.audit_logs: List[dict] = copy.deepcopy(SEED_AUDIT_LOGS)

    def reset_invoice(self, invoice_id: str) -> Optional[dict]:
        with self._lock:
            needle = invoice_id.strip().lower()
            orig = next(
                (i for i in SEED_INVOICES if i["id"].lower() == needle or i["invoice_number"].lower() == needle),
                None,
            )
            if orig:
                restored = copy.deepcopy(orig)
                self.invoices[restored["id"]] = restored
                return restored
            return None

    def get_invoice(self, id_or_number: str) -> Optional[dict]:
        with self._lock:
            needle = id_or_number.strip().lower()
            for inv in self.invoices.values():
                if inv["id"].lower() == needle or inv["invoice_number"].lower() == needle:
                    return copy.deepcopy(inv)
            return None

    def get_all_invoices(self) -> List[dict]:
        with self._lock:
            return [copy.deepcopy(inv) for inv in self.invoices.values()]

    def save_invoice(self, invoice_data: dict) -> dict:
        with self._lock:
            self.invoices[invoice_data["id"]] = copy.deepcopy(invoice_data)
            return copy.deepcopy(invoice_data)

    def get_purchase_orders(self) -> List[dict]:
        with self._lock:
            return copy.deepcopy(self.purchase_orders)

    def get_po(self, po_number: str) -> Optional[dict]:
        with self._lock:
            needle = po_number.strip().upper()
            for po in self.purchase_orders:
                if po["po_number"].strip().upper() == needle:
                    return copy.deepcopy(po)
            return None

    def get_audit_logs(self) -> List[dict]:
        with self._lock:
            return copy.deepcopy(self.audit_logs)

    def add_audit_log(self, entry: dict):
        with self._lock:
            self.audit_logs.insert(0, copy.deepcopy(entry))

    def compute_kpis(self) -> dict:
        with self._lock:
            invs = list(self.invoices.values())
            total_vol = BASE_PORTFOLIO_VOLUME + sum(i.get("grand_total", 0.0) for i in invs)
            leakage = BASE_PREVENTED_LEAKAGE + sum(
                i.get("total_variance_amount", 0.0)
                for i in invs
                if i.get("status") in ["EXCEPTION_FLAGGED", "REJECTED_DISPUTED"]
                and i.get("total_variance_amount", 0.0) > 0
            )
            pending = sum(1 for i in invs if i.get("status") == "EXCEPTION_FLAGGED")
            clean_in_ledger = sum(1 for i in invs if i.get("status") in ["VERIFIED_MATCH", "APPROVED_CLEAN"])
            resolved_in_ledger = sum(1 for i in invs if i.get("status") != "EXCEPTION_FLAGGED")
            total_clean = BASE_CLEAN_COUNT + clean_in_ledger
            total_resolved = BASE_RESOLVED_COUNT + resolved_in_ledger
            match_rate = round((total_clean / total_resolved) * 100, 1) if total_resolved > 0 else 0.0
            return {
                "total_audited_volume": round(total_vol, 2),
                "prevented_leakage_amount": round(leakage, 2),
                "pending_exceptions_count": pending,
                "clean_match_rate_percent": match_rate,
            }

    def get_dashboard_summary(self) -> dict:
        kpis = self.compute_kpis()
        invoices_list = []
        with self._lock:
            for inv in self.invoices.values():
                rules = inv.get("rule_evaluations", [])
                triggered = [r for r in rules if r.get("triggered")]
                primary = triggered[0]["rule_code"] if triggered else None
                invoices_list.append({
                    "id": inv["id"],
                    "invoice_number": inv["invoice_number"],
                    "vendor_name": inv["vendor_name"],
                    "po_reference": inv.get("po_reference", ""),
                    "invoice_date": inv["invoice_date"],
                    "grand_total": inv["grand_total"],
                    "po_baseline_grand_total": inv["po_baseline_grand_total"],
                    "total_variance_amount": inv["total_variance_amount"],
                    "status": inv["status"],
                    "triggered_rules_count": len(triggered),
                    "primary_flag": primary,
                    "confidence_score": inv.get("confidence_score", 1.0),
                    "sha256_hash": inv.get("sha256_hash", ""),
                })
        return {"kpis": kpis, "invoices": invoices_list}


_LEDGER_INSTANCE: Optional[InMemoryLedger] = None


def get_ledger() -> InMemoryLedger:
    global _LEDGER_INSTANCE
    if _LEDGER_INSTANCE is None:
        _LEDGER_INSTANCE = InMemoryLedger()
    return _LEDGER_INSTANCE
