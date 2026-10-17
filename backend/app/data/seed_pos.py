"""Authoritative ERP Purchase Order Seed Records for AuditFlow."""

SEED_PURCHASE_ORDERS = [
    {
        "po_number": "PO-2026-101",
        "vendor_name": "CloudHost Enterprise PK",
        "vendor_ntn": "NTN-4410928-1",
        "vendor_iban": "PK91MEZN00010203040506",
        "vendor_email": "accounts@cloudhost.pk",
        "authorized_grand_total": 950.00,
        "issue_date": "2026-10-01",
        "line_items": [
            {
                "po_line_id": "POL-101-1",
                "description": "Dedicated GPU Server Instance (Monthly)",
                "quantity": 1.0,
                "unit_price": 800.00,
                "line_total": 800.00,
            },
            {
                "po_line_id": "POL-101-2",
                "description": "Managed Cloud Backup Storage (5TB)",
                "quantity": 1.0,
                "unit_price": 150.00,
                "line_total": 150.00,
            },
        ],
    },
    {
        "po_number": "PO-2026-102",
        "vendor_name": "Apex Tech Solutions",
        "vendor_ntn": "NTN-8839201-4",
        "vendor_iban": "PK36SCBL00000011223344",
        "vendor_email": "billing@apextech.com",
        "authorized_grand_total": 2500.00,
        "issue_date": "2026-10-05",
        "line_items": [
            {
                "po_line_id": "POL-102-1",
                "description": "27-inch IPS Monitor Panel",
                "quantity": 10.0,
                "unit_price": 210.00,
                "line_total": 2100.00,
            },
            {
                "po_line_id": "POL-102-2",
                "description": "USB-C Docking Station",
                "quantity": 5.0,
                "unit_price": 80.00,
                "line_total": 400.00,
            },
        ],
    },
    {
        "po_number": "PO-2026-103",
        "vendor_name": "Prime Office Logistics",
        "vendor_ntn": "NTN-1129384-9",
        "vendor_iban": "PK12HABB00099887766554",
        "vendor_email": "billing@primeofficelogistics.com",
        "authorized_grand_total": 1200.00,
        "issue_date": "2026-10-02",
        "line_items": [
            {
                "po_line_id": "POL-103-1",
                "description": "Ergonomic Mesh Task Chair",
                "quantity": 6.0,
                "unit_price": 200.00,
                "line_total": 1200.00,
            },
        ],
    },
]
