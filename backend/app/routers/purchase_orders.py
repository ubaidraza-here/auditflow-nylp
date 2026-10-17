"""Authoritative ERP purchase orders router."""

from typing import List
from fastapi import APIRouter
from app.data.database import get_ledger
from app.models.schemas import PurchaseOrderRecord

router = APIRouter(prefix="/api/purchase-orders", tags=["Purchase Orders"])


@router.get("", response_model=List[PurchaseOrderRecord])
def get_purchase_orders() -> List[PurchaseOrderRecord]:
    ledger = get_ledger()
    pos = ledger.get_purchase_orders()
    return [PurchaseOrderRecord(**po) for po in pos]
