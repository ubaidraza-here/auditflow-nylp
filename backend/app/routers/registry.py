"""Authorized ERP Vendors and Contracts Registry Router."""

from typing import Dict, List, Any
from fastapi import APIRouter
from app.data.database import get_ledger

router = APIRouter(prefix="/api/registry", tags=["Registry"])


@router.get("/vendors")
def get_authorized_vendors() -> List[Dict[str, Any]]:
    """Returns unique authorized vendor profiles extracted from active ERP contracts."""
    ledger = get_ledger()
    pos = ledger.get_purchase_orders()
    vendors: Dict[str, Dict[str, Any]] = {}
    for po in pos:
        v_name = po.get("vendor_name")
        if v_name and v_name not in vendors:
            vendors[v_name] = {
                "vendor_name": v_name,
                "vendor_ntn": po.get("vendor_ntn", ""),
                "vendor_email": po.get("vendor_email", ""),
                "bank_account_or_iban": po.get("bank_account_or_iban", ""),
                "active_pos": [po.get("po_number")],
                "authorized_spend_limit": po.get("authorized_grand_total", 0.0),
            }
        elif v_name:
            vendors[v_name]["active_pos"].append(po.get("po_number"))
            vendors[v_name]["authorized_spend_limit"] += po.get("authorized_grand_total", 0.0)
    return list(vendors.values())


@router.get("/summary")
def get_registry_summary() -> Dict[str, Any]:
    """Returns ERP contract baseline metrics."""
    ledger = get_ledger()
    pos = ledger.get_purchase_orders()
    total_authorized = sum(po.get("authorized_grand_total", 0.0) for po in pos)
    unique_vendors = len(set(po.get("vendor_name") for po in pos if po.get("vendor_name")))
    return {
        "active_contracts_count": len(pos),
        "authorized_vendors_count": unique_vendors,
        "total_authorized_procurement_volume": round(total_authorized, 2),
    }
