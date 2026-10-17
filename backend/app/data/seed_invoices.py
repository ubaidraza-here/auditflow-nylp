"""Consolidated Seed Invoices for AuditFlow Ledger."""

from app.data.seed_invoices_b import INVOICE_1002
from app.data.seed_invoices_ac import INVOICES_AC
from app.data.seed_invoices_history import HISTORICAL_INVOICES

SEED_INVOICES = [INVOICE_1002] + INVOICES_AC + HISTORICAL_INVOICES
