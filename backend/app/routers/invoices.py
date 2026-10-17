"""Invoice detail and state reset router."""

from fastapi import APIRouter, HTTPException, status
from app.data.database import get_ledger
from app.models.schemas import InvoiceAuditRecord

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


@router.get("/{invoice_id}", response_model=InvoiceAuditRecord)
def get_invoice(invoice_id: str) -> InvoiceAuditRecord:
    ledger = get_ledger()
    invoice = ledger.get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found in ledger",
        )
    return InvoiceAuditRecord(**invoice)


@router.post("/{invoice_id}/reset")
def reset_single_invoice(invoice_id: str):
    ledger = get_ledger()
    restored = ledger.reset_invoice(invoice_id)
    if not restored:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found in blueprint seed",
        )
    return {"status": "invoice_reseeded", "invoice": restored}


@router.post("/reset")
def reset_entire_ledger():
    ledger = get_ledger()
    ledger.reset()
    count = len(ledger.get_all_invoices())
    return {"status": "ledger_reseeded", "invoices_count": count}
