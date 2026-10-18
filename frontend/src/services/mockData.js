// Pre-seeded demo and fallback data strictly aligned with docs/07_DATABASE_SCHEMA_AND_SEED_DATA.md

export const MOCK_KPIS = {
  total_audited_volume: 17500.0,
  prevented_leakage_amount: 4450.0,
  pending_exceptions_count: 2,
  clean_match_rate_percent: 33.3,
};

export function computeMockKpis(invoices) {
  const list = invoices || [];
  const totalVolume = list.reduce(
    (acc, inv) => acc + (Number(inv.grand_total || inv.billed_amount) || 0),
    0
  );
  const flagged = list.filter(
    (inv) =>
      inv.status === 'EXCEPTION_FLAGGED' ||
      inv.status === 'NEEDS_REVIEW' ||
      inv.status === 'FLAGGED'
  );

  const preventedLeakage = list.reduce((acc, inv) => {
    const status = String(inv.status || inv.new_status || '').toUpperCase();
    if (['APPROVED_WITH_OVERRIDE', 'APPROVED_OVERRIDE', 'OVERRIDE'].includes(status)) {
      return acc;
    }

    const isFlaggedOrDisputed = [
      'EXCEPTION_FLAGGED', 'NEEDS_REVIEW', 'FLAGGED',
      'REJECTED_DISPUTED', 'DISPUTED', 'REJECTED', 'REJECT', 'DISPUTE MEMO FILED'
    ].some((k) => status.includes(k)) || Boolean(inv.flag_reason) || Boolean(inv.discrepancies?.length > 0);

    if (!isFlaggedOrDisputed) return acc;

    const invNum = String(inv.invoice_number || '').toUpperCase();
    const flagR = String(inv.flag_reason || '').toUpperCase();
    const discs = inv.discrepancies || [];
    const isDup =
      invNum.includes('-REV') ||
      flagR.includes('DUPLICATE') ||
      discs.some((d) => String(d.rule_code || '').toUpperCase().includes('DUPLICATE') || String(d.title || '').toUpperCase().includes('DUPLICATE'));

    if (isDup) {
      const total = Number(inv.grand_total || inv.billed_amount || 0);
      const discSum = discs.reduce((s, d) => s + (Number(d.financial_impact || d.variance_amount) || 0), 0);
      const varVal = Number(inv.total_variance_amount || inv.variance_amount || 0);
      return acc + Math.max(total, discSum, varVal);
    }

    let discSum = 0;
    if (Array.isArray(inv.discrepancies) && inv.discrepancies.length > 0) {
      discSum = inv.discrepancies.reduce(
        (sum, d) => sum + (Number(d.financial_impact || d.variance_amount) || 0),
        0
      );
    }
    const varVal = Math.abs(Number(inv.total_variance_amount ?? inv.variance_amount ?? 0));
    let leakageVal = Math.max(discSum, varVal);
    if (leakageVal <= 0) {
      const billed = Number(inv.grand_total || inv.billed_amount || 0);
      const po = Number(
        inv.matched_purchase_order?.authorized_total ||
        inv.po_baseline_grand_total ||
        billed
      );
      leakageVal = Math.max(0, billed - po);
    }
    return acc + leakageVal;
  }, 0);

  const cleanInvoices = list.filter(
    (inv) =>
      ['VERIFIED_MATCH', 'MATCHED_APPROVED', 'APPROVED', 'AUTO_APPROVED', 'APPROVED_CLEAN', 'Approved Clean'].includes(inv.status) &&
      (inv.discrepancies?.length || 0) === 0 &&
      Math.abs(Number(inv.total_variance_amount || inv.variance_amount || 0)) === 0
  );
  const cleanMatchRate = list.length > 0 ? (cleanInvoices.length / list.length) * 100 : 0;
  return {
    total_audited_volume: Math.round(totalVolume * 100) / 100,
    prevented_leakage_amount: Math.round(preventedLeakage * 100) / 100,
    pending_exceptions_count: flagged.length,
    clean_match_rate_percent: Math.round(cleanMatchRate * 10) / 10,
  };
}

export const MOCK_PURCHASE_ORDERS = [
  {
    po_number: "PO-2026-101",
    vendor_name: "CloudHost Enterprise PK",
    vendor_tax_id: "NTN-4410928-1",
    vendor_email: "accounts@cloudhost.pk",
    expected_iban: "PK91MEZN00010203040506",
    issue_date: "2026-10-01",
    currency: "USD",
    authorized_subtotal: 950.0,
    authorized_tax_total: 0.0,
    authorized_grand_total: 950.0,
    status: "ACTIVE",
    line_items: [
      {
        po_line_id: "pol_01",
        item_code: "SRV-GPU-M",
        description: "Dedicated GPU Server Instance (Monthly)",
        authorized_quantity: 2,
        authorized_unit_price: 400.0,
        authorized_line_total: 800.0,
      },
      {
        po_line_id: "pol_02",
        item_code: "BKUP-AUTO",
        description: "Managed Automated Backups",
        authorized_quantity: 1,
        authorized_unit_price: 150.0,
        authorized_line_total: 150.0,
      },
    ],
  },
  {
    po_number: "PO-2026-102",
    vendor_name: "Apex Tech Solutions",
    vendor_tax_id: "NTN-8839201-4",
    vendor_email: "billing@apextech.com",
    expected_iban: "PK36SCBL00000011223344",
    issue_date: "2026-10-01",
    currency: "USD",
    authorized_subtotal: 2500.0,
    authorized_tax_total: 0.0,
    authorized_grand_total: 2500.0,
    status: "ACTIVE",
    line_items: [
      {
        po_line_id: "pol_03",
        item_code: "MON-DELL-27",
        description: "Dell 27-inch IPS Monitor",
        authorized_quantity: 10,
        authorized_unit_price: 210.0,
        authorized_line_total: 2100.0,
      },
      {
        po_line_id: "pol_04",
        item_code: "DOCK-USBC",
        description: "USB-C Docking Station",
        authorized_quantity: 5,
        authorized_unit_price: 80.0,
        authorized_line_total: 400.0,
      },
    ],
  },
  {
    po_number: "PO-2026-103",
    vendor_name: "Prime Office Logistics",
    vendor_tax_id: "NTN-1129384-9",
    vendor_email: "billing@primeofficelogistics.com",
    expected_iban: "PK12HABB00099887766554",
    issue_date: "2026-10-02",
    currency: "USD",
    authorized_subtotal: 1200.0,
    authorized_tax_total: 0.0,
    authorized_grand_total: 1200.0,
    status: "ACTIVE",
    line_items: [
      {
        po_line_id: "pol_05",
        item_code: "CHR-MESH-ERGO",
        description: "Ergonomic Mesh Task Chair",
        authorized_quantity: 4,
        authorized_unit_price: 300.0,
        authorized_line_total: 1200.0,
      },
    ],
  },
  {
    po_number: "PO-2026-104",
    vendor_name: "Nexus Enterprise Hardware Ltd",
    vendor_tax_id: "NTN-5521903-8",
    vendor_email: "billing@nexushardware.com",
    expected_iban: "PK92SCBL00000099887766",
    issue_date: "2026-10-05",
    currency: "USD",
    authorized_subtotal: 2500.0,
    authorized_tax_total: 0.0,
    authorized_grand_total: 2500.0,
    status: "ACTIVE",
    line_items: [
      {
        po_line_id: "pol_06",
        item_code: "MON-DELL-27",
        description: "Dell 27-inch IPS Monitor",
        authorized_quantity: 10,
        authorized_unit_price: 210.0,
        authorized_line_total: 2100.0,
      },
      {
        po_line_id: "pol_07",
        item_code: "DOCK-USBC",
        description: "USB-C Docking Station",
        authorized_quantity: 5,
        authorized_unit_price: 80.0,
        authorized_line_total: 400.0,
      },
    ],
  },
  {
    po_number: "PO-2026-105",
    vendor_name: "Vortex Cloud Infrastructure PK",
    vendor_tax_id: "NTN-7782104-2",
    vendor_email: "accounts@vortexcloud.pk",
    expected_iban: "PK44MEZN00010998877665",
    issue_date: "2026-10-05",
    currency: "USD",
    authorized_subtotal: 950.0,
    authorized_tax_total: 0.0,
    authorized_grand_total: 950.0,
    status: "ACTIVE",
    line_items: [
      {
        po_line_id: "pol_08",
        item_code: "SRV-GPU-M",
        description: "Dedicated GPU Server Instance (Monthly)",
        authorized_quantity: 2,
        authorized_unit_price: 400.0,
        authorized_line_total: 800.0,
      },
      {
        po_line_id: "pol_09",
        item_code: "BKUP-AUTO",
        description: "Managed Automated Backups",
        authorized_quantity: 1,
        authorized_unit_price: 150.0,
        authorized_line_total: 150.0,
      },
    ],
  },
  {
    po_number: "PO-2026-106",
    vendor_name: "Starlight Modern Office Solutions",
    vendor_tax_id: "NTN-9938102-5",
    vendor_email: "ar@starlightoffices.com",
    expected_iban: "PK18HABB00055443322110",
    issue_date: "2026-10-06",
    currency: "USD",
    authorized_subtotal: 1200.0,
    authorized_tax_total: 0.0,
    authorized_grand_total: 1200.0,
    status: "ACTIVE",
    line_items: [
      {
        po_line_id: "pol_10",
        item_code: "CHR-MESH-ERGO",
        description: "Ergonomic Mesh Task Chair",
        authorized_quantity: 4,
        authorized_unit_price: 300.0,
        authorized_line_total: 1200.0,
      },
    ],
  },
  {
    po_number: "PO-2026-107",
    vendor_name: "Krypton Cyber Defense Systems",
    vendor_tax_id: "NTN-6391024-7",
    vendor_email: "billing@kryptoncyber.com",
    expected_iban: "PK62BAHL00011223344556",
    issue_date: "2026-10-06",
    currency: "USD",
    authorized_subtotal: 800.0,
    authorized_tax_total: 0.0,
    authorized_grand_total: 800.0,
    status: "ACTIVE",
    line_items: [
      {
        po_line_id: "pol_11",
        item_code: "SEC-END-SUB",
        description: "Enterprise Endpoint Security Subscription",
        authorized_quantity: 10,
        authorized_unit_price: 50.0,
        authorized_line_total: 500.0,
      },
      {
        po_line_id: "pol_12",
        item_code: "SEC-SIEM-247",
        description: "24/7 Managed SIEM Intrusion Monitoring",
        authorized_quantity: 1,
        authorized_unit_price: 300.0,
        authorized_line_total: 300.0,
      },
    ],
  },
];

export const MOCK_INVOICES = [
  {
    invoice_id: "inv_1002",
    invoice_number: "INV-9042",
    vendor_name: "Apex Tech Solutions",
    po_reference: "PO-2026-102",
    invoice_date: "2026-10-14",
    grand_total: 2950.0,
    currency: "USD",
    status: "EXCEPTION_FLAGGED",
    extraction_confidence: 0.96,
    discrepancy_count: 2,
    flag_reason: "+$400 Unit Price Overcharge & Unapproved $50 Rush Fee",
    file_hash_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    file_url: "/uploads/apex_tech_inv_9042.pdf",
    extracted_data: {
      vendor_name: "Apex Tech Solutions",
      vendor_tax_id: "NTN-8839201-4",
      vendor_email: "billing@apextech.com",
      iban_or_account: "PK36SCBL00000011223344",
      invoice_number: "INV-9042",
      invoice_date: "2026-10-14",
      due_date: "2026-11-14",
      po_reference: "PO-2026-102",
      currency: "USD",
      subtotal: 2950.0,
      tax_total: 0.0,
      discount_amount: 0.0,
      grand_total: 2950.0,
    },
    matched_purchase_order: {
      po_number: "PO-2026-102",
      vendor_name: "Apex Tech Solutions",
      authorized_total: 2500.0,
      status: "ACTIVE",
    },
    line_item_comparisons: [
      {
        line_number: 1,
        invoice_description: "27-inch IPS Monitor Panel",
        matched_po_description: "Dell 27-inch IPS Monitor",
        po_quantity: 10,
        invoice_quantity: 10,
        po_unit_price: 210.0,
        invoice_unit_price: 250.0,
        po_line_total: 2100.0,
        invoice_line_total: 2500.0,
        variance_amount: 400.0,
        line_status: "OVERCHARGE",
      },
      {
        line_number: 2,
        invoice_description: "USB-C Docking Station",
        matched_po_description: "USB-C Docking Station",
        po_quantity: 5,
        invoice_quantity: 5,
        po_unit_price: 80.0,
        invoice_unit_price: 80.0,
        po_line_total: 400.0,
        invoice_line_total: 400.0,
        variance_amount: 0.0,
        line_status: "MATCH",
      },
      {
        line_number: 3,
        invoice_description: "Rush Delivery Fee",
        matched_po_description: null,
        po_quantity: 0,
        invoice_quantity: 1,
        po_unit_price: 0.0,
        invoice_unit_price: 50.0,
        po_line_total: 0.0,
        invoice_line_total: 50.0,
        variance_amount: 50.0,
        line_status: "UNAPPROVED_ITEM",
      },
    ],
    discrepancies: [
      {
        flag_id: "flag_1",
        rule_code: "UNIT_PRICE_OVERCHARGE",
        severity: "CRITICAL",
        title: "Unit Price Exceeds Contracted PO Rate",
        explanation: "Line 1 ('27-inch IPS Monitor Panel') is billed at $250.00/unit vs PO-2026-102 authorized price of $210.00/unit (+19.05% variance).",
        financial_impact: 400.0,
      },
      {
        flag_id: "flag_2",
        rule_code: "UNAPPROVED_LINE_ITEM",
        severity: "WARNING",
        title: "Unapproved Line Item on Invoice",
        explanation: "Line 3 ('Rush Delivery Fee' for $50.00) does not exist on authorized PO-2026-102.",
        financial_impact: 50.0,
      },
    ],
    dispute_email_draft: {
      recipient: "billing@apextech.com",
      subject: "DISCREPANCY NOTICE: Invoice #INV-9042 (Ref: PO-2026-102)",
      body: `Dear Apex Tech Solutions Billing Team,

During our automated three-way reconciliation of Invoice #INV-9042 dated 2026-10-14 against authorized Purchase Order #PO-2026-102, our compliance audit identified the following billing discrepancies:

1. Dell 27" IPS Monitor (Qty: 10): Billed at $250.00/unit vs. contracted PO rate of $210.00/unit (Overcharge: +$400.00).
2. Unapproved Line Item: "Rush Delivery Fee" ($50.00) is not authorized on PO-2026-102.

Total Disputed Variance: $450.00
Expected Corrected Total: $2,500.00

Please cancel invoice #INV-9042 and issue a revised invoice reflecting authorized contracted rates so payment can be released immediately.

Regards,
Accounts Payable Audit Team
AuditFlow Institutional Compliance`,
    },
  },
  {
    invoice_id: "inv_1001",
    invoice_number: "INV-8801",
    vendor_name: "CloudHost Enterprise PK",
    po_reference: "PO-2026-101",
    invoice_date: "2026-10-14",
    grand_total: 950.0,
    currency: "USD",
    status: "VERIFIED_MATCH",
    extraction_confidence: 0.99,
    discrepancy_count: 0,
    flag_reason: "Clean 3-Way Match Verified",
    file_hash_sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    file_url: "/uploads/cloudhost_inv_8801.pdf",
    extracted_data: {
      vendor_name: "CloudHost Enterprise PK",
      vendor_tax_id: "NTN-4410928-1",
      vendor_email: "accounts@cloudhost.pk",
      iban_or_account: "PK91MEZN00010203040506",
      invoice_number: "INV-8801",
      invoice_date: "2026-10-14",
      due_date: "2026-11-14",
      po_reference: "PO-2026-101",
      currency: "USD",
      subtotal: 950.0,
      tax_total: 0.0,
      discount_amount: 0.0,
      grand_total: 950.0,
    },
    matched_purchase_order: {
      po_number: "PO-2026-101",
      vendor_name: "CloudHost Enterprise PK",
      authorized_total: 950.0,
      status: "ACTIVE",
    },
    line_item_comparisons: [
      {
        line_number: 1,
        invoice_description: "Dedicated GPU Server Instance (Monthly)",
        matched_po_description: "Dedicated GPU Server Instance (Monthly)",
        po_quantity: 2,
        invoice_quantity: 2,
        po_unit_price: 400.0,
        invoice_unit_price: 400.0,
        po_line_total: 800.0,
        invoice_line_total: 800.0,
        variance_amount: 0.0,
        line_status: "MATCH",
      },
      {
        line_number: 2,
        invoice_description: "Managed Automated Backups",
        matched_po_description: "Managed Automated Backups",
        po_quantity: 1,
        invoice_quantity: 1,
        po_unit_price: 150.0,
        invoice_unit_price: 150.0,
        po_line_total: 150.0,
        invoice_line_total: 150.0,
        variance_amount: 0.0,
        line_status: "MATCH",
      },
    ],
    discrepancies: [],
    dispute_email_draft: null,
  },
  {
    invoice_id: "inv_1003",
    invoice_number: "INV-7710-REV",
    vendor_name: "Prime Office Logistics",
    po_reference: "PO-2026-103",
    invoice_date: "2026-10-14",
    grand_total: 1200.0,
    currency: "USD",
    status: "EXCEPTION_FLAGGED",
    extraction_confidence: 0.94,
    discrepancy_count: 1,
    total_variance_amount: 1200.0,
    variance_amount: 1200.0,
    flag_reason: "Critical: Potential Duplicate of Paid Invoice #INV-7710",
    file_hash_sha256: "bc95d6f1a8c0ef783b9e4a3b1109012354cfa228163f87a2df85d8e7c85885e3",
    file_url: "/uploads/prime_office_inv_7710_rev.pdf",
    extracted_data: {
      vendor_name: "Prime Office Logistics",
      vendor_tax_id: "NTN-1129384-9",
      vendor_email: "billing@primeofficelogistics.com",
      iban_or_account: "PK12HABB00099887766554",
      invoice_number: "INV-7710-REV",
      invoice_date: "2026-10-14",
      due_date: "2026-11-14",
      po_reference: "PO-2026-103",
      currency: "USD",
      subtotal: 1200.0,
      tax_total: 0.0,
      discount_amount: 0.0,
      grand_total: 1200.0,
    },
    matched_purchase_order: {
      po_number: "PO-2026-103",
      vendor_name: "Prime Office Logistics",
      authorized_total: 1200.0,
      status: "ACTIVE",
    },
    line_item_comparisons: [
      {
        line_number: 1,
        invoice_description: "Ergonomic Mesh Task Chair",
        matched_po_description: "Ergonomic Mesh Task Chair",
        po_quantity: 4,
        invoice_quantity: 4,
        po_unit_price: 300.0,
        invoice_unit_price: 300.0,
        po_line_total: 1200.0,
        invoice_line_total: 1200.0,
        variance_amount: 1200.0,
        line_status: "DUPLICATE",
      },
    ],
    discrepancies: [
      {
        flag_id: "flag_dup_1",
        rule_code: "CRITICAL_FUZZY_DUPLICATE",
        severity: "CRITICAL",
        title: "Potential Duplicate of Paid Invoice",
        explanation: "Invoice #INV-7710-REV matches historical paid invoice #INV-7710 (Vendor: Prime Office Logistics, Total: $1,200.00, Paid: 2026-10-03). High duplicate risk detected.",
        financial_impact: 1200.0,
      },
    ],
    dispute_email_draft: {
      recipient: "billing@primeofficelogistics.com",
      subject: "DUPLICATE BILLING NOTICE: Invoice #INV-7710-REV (Ref: PO-2026-103)",
      body: `Dear Prime Office Logistics Billing Team,\n\nOur automated audit ledger detected that Invoice #INV-7710-REV dated 2026-10-14 for $1,200.00 is a duplicate submission of previously approved and disbursed Invoice #INV-7710 (Disbursed: 2026-10-03).\n\nDisputed Amount: $1,200.00\n\nPlease verify your billing records and retract this invoice immediately.\n\nRegards,\nAccounts Payable Audit Team\nAuditFlow Institutional Compliance`,
    },
  },
  {
    invoice_id: "inv_0998",
    invoice_number: "INV-7710",
    vendor_name: "Prime Office Logistics",
    po_reference: "PO-2026-103",
    invoice_date: "2026-10-03",
    grand_total: 1200.0,
    currency: "USD",
    status: "APPROVED_CLEAN",
    extraction_confidence: 0.98,
    discrepancy_count: 0,
    flag_reason: "Audited & Disbursed via ERP",
    file_hash_sha256: "45f8b9e671239c01824efba65123deaa894561230198423efba65123deaa8945",
    file_url: "/uploads/prime_office_inv_7710.pdf",
    extracted_data: {
      vendor_name: "Prime Office Logistics",
      vendor_tax_id: "NTN-1129384-9",
      vendor_email: "billing@primeofficelogistics.com",
      iban_or_account: "PK12HABB00099887766554",
      invoice_number: "INV-7710",
      invoice_date: "2026-10-03",
      due_date: "2026-11-03",
      po_reference: "PO-2026-103",
      currency: "USD",
      subtotal: 1200.0,
      tax_total: 0.0,
      discount_amount: 0.0,
      grand_total: 1200.0,
    },
    matched_purchase_order: {
      po_number: "PO-2026-103",
      vendor_name: "Prime Office Logistics",
      authorized_total: 1200.0,
      status: "ACTIVE",
    },
    line_item_comparisons: [
      {
        line_number: 1,
        invoice_description: "Ergonomic Mesh Task Chair",
        matched_po_description: "Ergonomic Mesh Task Chair",
        po_quantity: 4,
        invoice_quantity: 4,
        po_unit_price: 300.0,
        invoice_unit_price: 300.0,
        po_line_total: 1200.0,
        invoice_line_total: 1200.0,
        variance_amount: 0.0,
        line_status: "MATCH",
      },
    ],
    discrepancies: [],
    dispute_email_draft: null,
  },
  {
    invoice_id: "inv_0995",
    invoice_number: "INV-6540",
    vendor_name: "CyberNet Telecomm",
    po_reference: "PO-2026-088",
    invoice_date: "2026-10-01",
    grand_total: 3400.0,
    currency: "USD",
    status: "APPROVED_WITH_OVERRIDE",
    extraction_confidence: 0.95,
    discrepancy_count: 1,
    flag_reason: "Manager Override: Emergency bandwidth surge approved",
    file_hash_sha256: "99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff",
    file_url: "/uploads/cybernet_inv_6540.pdf",
    extracted_data: {
      vendor_name: "CyberNet Telecomm",
      vendor_tax_id: "NTN-6655443-2",
      vendor_email: "billing@cybernet.pk",
      iban_or_account: "PK55HABB00012345678901",
      invoice_number: "INV-6540",
      invoice_date: "2026-10-01",
      due_date: "2026-11-01",
      po_reference: "PO-2026-088",
      currency: "USD",
      subtotal: 3400.0,
      tax_total: 0.0,
      discount_amount: 0.0,
      grand_total: 3400.0,
    },
    matched_purchase_order: {
      po_number: "PO-2026-088",
      vendor_name: "CyberNet Telecomm",
      authorized_total: 3000.0,
      status: "ACTIVE",
    },
    line_item_comparisons: [
      {
        line_number: 1,
        invoice_description: "10Gbps Uplink Dedicated Circuit",
        matched_po_description: "10Gbps Uplink Dedicated Circuit",
        po_quantity: 1,
        invoice_quantity: 1,
        po_unit_price: 3000.0,
        invoice_unit_price: 3000.0,
        po_line_total: 3000.0,
        invoice_line_total: 3000.0,
        variance_amount: 0.0,
        line_status: "MATCH",
      },
      {
        line_number: 2,
        invoice_description: "Surge Bandwidth Burst (48hrs)",
        matched_po_description: null,
        po_quantity: 0,
        invoice_quantity: 1,
        po_unit_price: 0.0,
        invoice_unit_price: 400.0,
        po_line_total: 0.0,
        invoice_line_total: 400.0,
        variance_amount: 400.0,
        line_status: "UNAPPROVED_ITEM",
      },
    ],
    discrepancies: [
      {
        flag_id: "flag_cyber_1",
        rule_code: "UNAPPROVED_SURGE_FEE",
        severity: "WARNING",
        title: "Unscheduled Bandwidth Surge Fee",
        explanation: "Surge Bandwidth ($400.00) billed above baseline PO contracted amount.",
        financial_impact: 400.0,
      },
    ],
    dispute_email_draft: null,
  },
  {
    invoice_id: "inv_0990",
    invoice_number: "INV-5412",
    vendor_name: "MegaServer Global",
    po_reference: "PO-2026-075",
    invoice_date: "2026-09-28",
    grand_total: 7800.0,
    currency: "USD",
    status: "REJECTED_DISPUTED",
    extraction_confidence: 0.92,
    discrepancy_count: 3,
    flag_reason: "Disputed: Phantom maintenance charge without SOW",
    file_hash_sha256: "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    file_url: "/uploads/megaserver_inv_5412.pdf",
    extracted_data: {
      vendor_name: "MegaServer Global",
      vendor_tax_id: "NTN-9988112-3",
      vendor_email: "billing@megaserver.com",
      iban_or_account: "PK88BAHL00098765432100",
      invoice_number: "INV-5412",
      invoice_date: "2026-09-28",
      due_date: "2026-10-28",
      po_reference: "PO-2026-075",
      currency: "USD",
      subtotal: 7800.0,
      tax_total: 0.0,
      discount_amount: 0.0,
      grand_total: 7800.0,
    },
    matched_purchase_order: {
      po_number: "PO-2026-075",
      vendor_name: "MegaServer Global",
      authorized_total: 5000.0,
      status: "ACTIVE",
    },
    line_item_comparisons: [
      {
        line_number: 1,
        invoice_description: "Enterprise Rack Space (Monthly)",
        matched_po_description: "Enterprise Rack Space (Monthly)",
        po_quantity: 2,
        invoice_quantity: 2,
        po_unit_price: 2500.0,
        invoice_unit_price: 2500.0,
        po_line_total: 5000.0,
        invoice_line_total: 5000.0,
        variance_amount: 0.0,
        line_status: "MATCH",
      },
      {
        line_number: 2,
        invoice_description: "Unscheduled Infrastructure Maintenance",
        matched_po_description: null,
        po_quantity: 0,
        invoice_quantity: 1,
        po_unit_price: 0.0,
        invoice_unit_price: 2800.0,
        po_line_total: 0.0,
        invoice_line_total: 2800.0,
        variance_amount: 2800.0,
        line_status: "UNAPPROVED_ITEM",
      },
    ],
    discrepancies: [
      {
        flag_id: "flag_mega_1",
        rule_code: "UNAUTHORIZED_SERVICE_FEE",
        severity: "CRITICAL",
        title: "Phantom Maintenance Charge Without SOW",
        explanation: "Line 2 ($2,800.00) was never contracted in PO-2026-075 nor supported by signed change order.",
        financial_impact: 2800.0,
      },
    ],
    dispute_email_draft: {
      recipient: "billing@megaserver.com",
      subject: "FORMAL DISPUTE: Unauthorized Maintenance Charge on INV-5412",
      body: `Dear MegaServer Global Billing,\n\nWe have rejected invoice INV-5412 due to an unauthorized charge of $2,800.00 for unscheduled infrastructure maintenance without an agreed Statement of Work.\n\nPlease cancel this invoice immediately.\n\nRegards,\nAccounts Payable Audit Team`,
    },
  },
];

export const MOCK_AUDIT_LOGS = [
  {
    log_id: "log_5001",
    timestamp: "2026-10-14T14:22:10Z",
    invoice_id: "inv_1002",
    invoice_number: "INV-9042",
    vendor_name: "Apex Tech Solutions",
    actor_name: "Ubaid Raza (Senior AP Auditor)",
    action_type: "FLAGGED_DISCREPANCY",
    previous_status: "PROCESSING",
    new_status: "EXCEPTION_FLAGGED",
    financial_impact_saved: 450.0,
    prevented_leakage: 450.0,
    financial_impact: 450.0,
    variance_amount: 450.0,
    justification_notes: "Deterministic auditor caught $400 unit price variance on Dell monitors + $50 unapproved fee.",
  },
  {
    log_id: "log_5002",
    timestamp: "2026-10-14T11:05:40Z",
    invoice_id: "inv_1001",
    invoice_number: "INV-8801",
    vendor_name: "CloudHost Enterprise PK",
    actor_name: "System Triage Engine",
    action_type: "AUTO_VERIFY",
    previous_status: "PROCESSING",
    new_status: "VERIFIED_MATCH",
    financial_impact_saved: 0.0,
    justification_notes: "100% price, quantity, and tax arithmetic matched PO-2026-101.",
  },
  {
    log_id: "log_5003",
    timestamp: "2026-10-03T16:45:00Z",
    invoice_id: "inv_0998",
    invoice_number: "INV-7710",
    vendor_name: "Prime Office Logistics",
    actor_name: "Finance Controller",
    action_type: "APPROVE_PAYMENT",
    previous_status: "VERIFIED_MATCH",
    new_status: "APPROVED_CLEAN",
    financial_impact_saved: 0.0,
    justification_notes: "Approved clean invoice release to disbursement queue.",
  },
];

// Immutable blueprint of original seed invoices for pristine demo resets
export const INITIAL_MOCK_INVOICES = JSON.parse(JSON.stringify(MOCK_INVOICES));
export const getInitialMockInvoices = () => JSON.parse(JSON.stringify(INITIAL_MOCK_INVOICES));
