// Pure Seed Data & Initial In-Memory State for Frontend Resiliency
export const INITIAL_PURCHASE_ORDERS = [
  {
    po_number: "PO-2026-101",
    vendor_name: "CloudHost Enterprise PK",
    vendor_ntn: "NTN-4410928-1",
    vendor_iban: "PK91MEZN00010203040506",
    vendor_email: "accounts@cloudhost.pk",
    grand_total: 950.00,
    issue_date: "2026-10-01",
    lines: [
      { id: "POL-101-1", description: "Dedicated GPU Server Instance (Monthly)", qty: 1.0, rate: 800.00, subtotal: 800.00 },
      { id: "POL-101-2", description: "Managed Cloud Backup Storage (5TB)", qty: 1.0, rate: 150.00, subtotal: 150.00 }
    ]
  },
  {
    po_number: "PO-2026-102",
    vendor_name: "Apex Tech Solutions",
    vendor_ntn: "NTN-8839201-4",
    vendor_iban: "PK36SCBL00000011223344",
    vendor_email: "billing@apextech.com",
    grand_total: 2500.00,
    issue_date: "2026-10-05",
    lines: [
      { id: "POL-102-1", description: "27-inch IPS Monitor Panel", qty: 10.0, rate: 210.00, subtotal: 2100.00 },
      { id: "POL-102-2", description: "USB-C Docking Station", qty: 5.0, rate: 80.00, subtotal: 400.00 }
    ]
  },
  {
    po_number: "PO-2026-103",
    vendor_name: "Prime Office Logistics",
    vendor_ntn: "NTN-1129384-9",
    vendor_iban: "PK12HABB00099887766554",
    vendor_email: "billing@primeofficelogistics.com",
    grand_total: 1200.00,
    issue_date: "2026-10-02",
    lines: [
      { id: "POL-103-1", description: "Ergonomic Mesh Task Chair", qty: 6.0, rate: 200.00, subtotal: 1200.00 }
    ]
  }
];

export const INITIAL_INVOICES = [
  {
    id: "inv_1002",
    invoice_number: "INV-9042",
    vendor_name: "Apex Tech Solutions",
    vendor_ntn: "NTN-8839201-4",
    vendor_email: "billing@apextech.com",
    bank_account_or_iban: "PK36SCBL00000011223344",
    invoice_date: "2026-10-14",
    due_date: "2026-11-13",
    po_reference: "PO-2026-102",
    currency: "USD",
    subtotal: 2900.00,
    tax_total: 0.00,
    discount_amount: 0.00,
    grand_total: 2950.00,
    po_baseline_grand_total: 2500.00,
    total_variance_amount: 450.00,
    status: "EXCEPTION_FLAGGED",
    confidence_score: 0.98,
    sha256_hash: "a4f89d31c2b5e7104b2a9e3d810f4c9a7b6e5d4c3b2a1098f7e6d5c4b3a20198",
    file_name: "INV-9042_ApexTech.png",
    primary_flag: "UNIT_PRICE_OVERCHARGE",
    triggered_rules_count: 2,
    line_items: [
      { line_number: 1, description: "27-inch IPS Monitor Panel", quantity: 10.0, unit_price: 250.00, line_total: 2500.00, matched_po_line_id: "POL-102-1", bounding_box: { ymin: 440, xmin: 65, ymax: 480, xmax: 935 } },
      { line_number: 2, description: "USB-C Docking Station", quantity: 5.0, unit_price: 80.00, line_total: 400.00, matched_po_line_id: "POL-102-2", bounding_box: { ymin: 485, xmin: 65, ymax: 520, xmax: 935 } },
      { line_number: 3, description: "Rush Delivery & Handling Fee", quantity: 1.0, unit_price: 50.00, line_total: 50.00, matched_po_line_id: null, bounding_box: { ymin: 525, xmin: 65, ymax: 560, xmax: 935 } }
    ],
    rule_evaluations: [
      { rule_code: "UNIT_PRICE_OVERCHARGE", rule_name: "Unit Price Overcharge", severity: "CRITICAL", triggered: true, message: "Line 1 billed @ $250.00 vs PO $210.00 (+19.05% overrun)", variance_amount: 400.00 },
      { rule_code: "UNAPPROVED_LINE_ITEM", rule_name: "Unapproved Surcharge", severity: "HIGH", triggered: true, message: "Line 3 Rush Delivery Fee not authorized in PO-2026-102", variance_amount: 50.00 },
      { rule_code: "EXACT_FILE_DUPLICATE", rule_name: "Exact File Collision", severity: "CRITICAL", triggered: false, message: "SHA-256 unique in ledger", variance_amount: 0.00 },
      { rule_code: "INTERNAL_MATH_ERROR", rule_name: "Mathematical Integrity", severity: "CRITICAL", triggered: false, message: "Sum of lines matches total", variance_amount: 0.00 }
    ]
  },
  {
    id: "inv_1001",
    invoice_number: "INV-8801",
    vendor_name: "CloudHost Enterprise PK",
    vendor_ntn: "NTN-4410928-1",
    vendor_email: "accounts@cloudhost.pk",
    bank_account_or_iban: "PK91MEZN00010203040506",
    invoice_date: "2026-10-15",
    due_date: "2026-11-14",
    po_reference: "PO-2026-101",
    currency: "USD",
    subtotal: 950.00,
    tax_total: 0.00,
    discount_amount: 0.00,
    grand_total: 950.00,
    po_baseline_grand_total: 950.00,
    total_variance_amount: 0.00,
    status: "VERIFIED_MATCH",
    confidence_score: 0.99,
    sha256_hash: "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
    file_name: "INV-8801_CloudHost.pdf",
    primary_flag: "CLEARED_MATCH",
    triggered_rules_count: 0,
    line_items: [
      { line_number: 1, description: "Dedicated GPU Server Instance (Monthly)", quantity: 1.0, unit_price: 800.00, line_total: 800.00, matched_po_line_id: "POL-101-1" },
      { line_number: 2, description: "Managed Cloud Backup Storage (5TB)", quantity: 1.0, unit_price: 150.00, line_total: 150.00, matched_po_line_id: "POL-101-2" }
    ],
    rule_evaluations: []
  },
  {
    id: "inv_1003",
    invoice_number: "INV-7710-REV",
    vendor_name: "Prime Office Logistics",
    vendor_ntn: "NTN-1129384-9",
    vendor_email: "billing@primeofficelogistics.com",
    bank_account_or_iban: "PK12HABB00099887766554",
    invoice_date: "2026-10-12",
    due_date: "2026-11-11",
    po_reference: "PO-2026-103",
    currency: "USD",
    subtotal: 1200.00,
    tax_total: 0.00,
    discount_amount: 0.00,
    grand_total: 1200.00,
    po_baseline_grand_total: 1200.00,
    total_variance_amount: 0.00,
    status: "EXCEPTION_FLAGGED",
    confidence_score: 0.95,
    sha256_hash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    file_name: "INV-7710-REV_Duplicate.pdf",
    primary_flag: "CRITICAL_FUZZY_DUPLICATE",
    triggered_rules_count: 1,
    line_items: [
      { line_number: 1, description: "Ergonomic Mesh Task Chair", quantity: 6.0, unit_price: 200.00, line_total: 1200.00, matched_po_line_id: "POL-103-1" }
    ],
    rule_evaluations: [
      { rule_code: "CRITICAL_FUZZY_DUPLICATE", rule_name: "Fuzzy Duplicate Suffix", severity: "CRITICAL", triggered: true, message: "Collides with settled invoice INV-7710 ($1,200.00)", variance_amount: 1200.00 }
    ]
  },
  {
    id: "inv_1000",
    invoice_number: "INV-7710",
    vendor_name: "Prime Office Logistics",
    vendor_ntn: "NTN-1129384-9",
    vendor_email: "billing@primeofficelogistics.com",
    bank_account_or_iban: "PK12HABB00099887766554",
    invoice_date: "2026-09-20",
    due_date: "2026-10-20",
    po_reference: "PO-2026-103",
    currency: "USD",
    grand_total: 1200.00,
    po_baseline_grand_total: 1200.00,
    total_variance_amount: 0.00,
    status: "APPROVED_CLEAN",
    confidence_score: 0.99,
    sha256_hash: "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    reviewer_name: "Ubaid Raza",
    reviewed_at: "2026-10-01T10:00:00Z"
  },
  {
    id: "inv_1004",
    invoice_number: "INV-6540",
    vendor_name: "CyberNet Telecomm",
    vendor_ntn: "NTN-7721839-2",
    vendor_email: "corp@cybernet.pk",
    po_reference: "PO-2026-088",
    currency: "USD",
    grand_total: 3400.00,
    po_baseline_grand_total: 3000.00,
    total_variance_amount: 400.00,
    status: "APPROVED_WITH_OVERRIDE",
    confidence_score: 0.94,
    reviewer_name: "Ubaid Raza",
    override_reason: "Critical fiber restoration overtime surcharge authorized by IT Director."
  },
  {
    id: "inv_1005",
    invoice_number: "INV-5412",
    vendor_name: "MegaServer Global",
    vendor_ntn: "NTN-9988112-0",
    vendor_email: "disputes@megaserver.com",
    po_reference: "PO-2026-075",
    currency: "USD",
    grand_total: 7800.00,
    po_baseline_grand_total: 5000.00,
    total_variance_amount: 2800.00,
    status: "REJECTED_DISPUTED",
    confidence_score: 0.96,
    reviewer_name: "Ubaid Raza",
    dispute_memo: "Dispute notice dispatched for uncontracted storage server rack charge."
  }
];

export const INITIAL_AUDIT_LOGS = [
  { id: "log_001", timestamp: "2026-10-14T09:15:22Z", invoice_id: "inv_1000", invoice_number: "INV-7710", event_type: "AUDIT_APPROVED_CLEAN", actor: "Ubaid Raza", details: "Clean 3-way match cleared for disbursement." },
  { id: "log_002", timestamp: "2026-10-14T11:42:05Z", invoice_id: "inv_1002", invoice_number: "INV-9042", event_type: "EXCEPTION_DETECTED", actor: "AuditFlow Engine", details: "Triggered UNIT_PRICE_OVERCHARGE (+$400) and UNAPPROVED_LINE_ITEM (+$50)." }
];
