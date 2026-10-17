"""Immutable seed audit logs for AuditFlow ledger."""

SEED_AUDIT_LOGS = [
    {
        "id": "log_001",
        "timestamp": "2026-10-14T09:15:22Z",
        "invoice_id": "inv_1000",
        "invoice_number": "INV-7710",
        "event_type": "AUDIT_APPROVED_CLEAN",
        "actor": "Ubaid Raza",
        "details": "Invoice passed 3-way match. Cleared for disbursement.",
    },
    {
        "id": "log_002",
        "timestamp": "2026-10-14T11:42:05Z",
        "invoice_id": "inv_1002",
        "invoice_number": "INV-9042",
        "event_type": "EXCEPTION_DETECTED",
        "actor": "AuditFlow Engine",
        "details": "Triggered UNIT_PRICE_OVERCHARGE (+$400) and UNAPPROVED_LINE_ITEM (+$50).",
    },
]
