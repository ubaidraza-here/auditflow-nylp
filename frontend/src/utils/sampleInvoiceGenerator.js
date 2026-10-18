/**
 * Dynamic HTML5 Canvas Commercial Tax Invoice PNG Generator
 * Allows judges and auditors to download real high-resolution invoice PNGs
 * with 1 click for live drag-and-drop verification.
 */

const SAMPLE_TEMPLATES = {
  SCENARIO_B_OVERCHARGE: {
    filename: 'Apex_Tech_INV-9042_Overcharge.png',
    vendor: 'Apex Tech Solutions',
    taxId: 'NTN-8839201-4',
    email: 'billing@apextech.com',
    iban: 'PK36SCBL00000011223344',
    invoiceNumber: 'INV-9042',
    date: '2026-10-14',
    dueDate: '2026-11-14',
    poRef: 'PO-2026-102',
    items: [
      { desc: '27-inch IPS Monitor Panel', qty: 10, price: 250.0, total: 2500.0 },
      { desc: 'USB-C Multiport Docking Station', qty: 5, price: 80.0, total: 400.0 },
      { desc: 'Rush Delivery Expedited Fee (Unapproved)', qty: 1, price: 50.0, total: 50.0 },
    ],
    subtotal: 2950.0,
    tax: 0.0,
    grandTotal: 2950.0,
    note: 'FLAGGED DEMO: $250/unit monitor price exceeds PO rate of $210, plus $50 rush fee.',
  },
  SCENARIO_A_CLEAN: {
    filename: 'CloudHost_INV-8801_Clean.png',
    vendor: 'CloudHost Enterprise PK',
    taxId: 'NTN-4410928-1',
    email: 'billing@cloudhost.pk',
    iban: 'PK91MEZN00010203040506',
    invoiceNumber: 'INV-8801',
    date: '2026-10-14',
    dueDate: '2026-11-14',
    poRef: 'PO-2026-101',
    items: [
      { desc: 'Dedicated GPU Server Instance (Monthly)', qty: 2, price: 400.0, total: 800.0 },
      { desc: 'Managed Automated Backups', qty: 1, price: 150.0, total: 150.0 },
    ],
    subtotal: 950.0,
    tax: 0.0,
    grandTotal: 950.0,
    note: 'CLEAN DEMO: 100% price and quantity match with PO-2026-101.',
  },
  SCENARIO_C_DUPLICATE: {
    filename: 'PrimeOffice_INV-7710_Duplicate.png',
    vendor: 'Prime Office Logistics',
    taxId: 'NTN-1129384-9',
    email: 'accounts@primeoffice.pk',
    iban: 'PK12HABB00099887766554',
    invoiceNumber: 'INV-7710-REV',
    date: '2026-10-14',
    dueDate: '2026-11-03',
    poRef: 'PO-2026-103',
    items: [
      { desc: 'Ergonomic Mesh Task Chair (Office Suite)', qty: 4, price: 300.0, total: 1200.0 },
    ],
    subtotal: 1200.0,
    tax: 0.0,
    grandTotal: 1200.0,
    note: 'DUPLICATE DEMO: Exact duplicate billing against previously paid INV-7710.',
  },
};

export function renderInvoiceToCanvas(sampleKey = 'SCENARIO_B_OVERCHARGE') {
  const data = SAMPLE_TEMPLATES[sampleKey] || SAMPLE_TEMPLATES.SCENARIO_B_OVERCHARGE;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1200, 1500);

  // Outer border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1140, 1440);

  // Header Banner: Deep Fjord Navy
  ctx.fillStyle = '#0A2540';
  ctx.fillRect(30, 30, 1140, 140);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('COMMERCIAL TAX INVOICE', 70, 95);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('SECURE ENTERPRISE BILLING RECORD • AUDITFLOW INTAKE CALIBRATED', 70, 130);

  // Top Metadata Pill
  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect(940, 65, 200, 70);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(data.invoiceNumber, 960, 105);

  // Vendor & Client Info
  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(data.vendor, 70, 225);

  ctx.fillStyle = '#475569';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Tax NTN: ${data.taxId}`, 70, 255);
  ctx.fillText(`Billing Email: ${data.email}`, 70, 280);
  ctx.fillText(`Authorized IBAN: ${data.iban}`, 70, 305);

  // Bill To (Right Side)
  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('BILL TO / CORPORATE RECIPIENT:', 700, 225);
  ctx.fillStyle = '#475569';
  ctx.font = '14px sans-serif';
  ctx.fillText('AuditFlow Corporate Treasury Desk', 700, 255);
  ctx.fillText(`PO Baseline Reference: ${data.poRef}`, 700, 280);
  ctx.fillText(`Invoice Date: ${data.date}  |  Due: ${data.dueDate}`, 700, 305);

  // Table Header
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(70, 360, 1060, 45);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.strokeRect(70, 360, 1060, 45);

  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('LN#', 90, 388);
  ctx.fillText('DESCRIPTION & SPECIFICATION', 160, 388);
  ctx.fillText('QTY', 700, 388);
  ctx.fillText('UNIT PRICE', 820, 388);
  ctx.fillText('TOTAL (USD)', 990, 388);

  // Table Rows
  let y = 440;
  data.items.forEach((item, idx) => {
    ctx.fillStyle = '#1E293B';
    ctx.font = '14px monospace';
    ctx.fillText(String(idx + 1).padStart(2, '0'), 95, y);
    ctx.font = '14px sans-serif';
    ctx.fillText(item.desc, 160, y);
    ctx.font = '14px monospace';
    ctx.fillText(String(item.qty), 710, y);
    ctx.fillText(`$${item.price.toFixed(2)}`, 830, y);
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`$${item.total.toFixed(2)}`, 990, y);

    // Row divider line
    ctx.strokeStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.moveTo(70, y + 20);
    ctx.lineTo(1130, y + 20);
    ctx.stroke();

    y += 60;
  });

  // Summary Totals Box
  const totalsY = Math.max(y + 30, 750);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(680, totalsY, 450, 180);
  ctx.strokeStyle = '#E2E8F0';
  ctx.strokeRect(680, totalsY, 450, 180);

  ctx.fillStyle = '#475569';
  ctx.font = '14px sans-serif';
  ctx.fillText('Subtotal Authorized:', 710, totalsY + 40);
  ctx.fillText('Tax / VAT (0.00%):', 710, totalsY + 80);

  ctx.font = '15px monospace';
  ctx.fillText(`$${data.subtotal.toFixed(2)}`, 1000, totalsY + 40);
  ctx.fillText(`$${data.tax.toFixed(2)}`, 1000, totalsY + 80);

  ctx.strokeStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.moveTo(700, totalsY + 110);
  ctx.lineTo(1110, totalsY + 110);
  ctx.stroke();

  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('GRAND TOTAL:', 710, totalsY + 150);
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`$${data.grandTotal.toFixed(2)}`, 970, totalsY + 150);

  // Security Verification Stamp
  ctx.strokeStyle = '#0A2540';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 1150, 1060, 120);
  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('CRYPTOGRAPHIC SECURITY STAMP • VERIFIABLE AUDIT TRAIL', 95, 1185);
  ctx.fillStyle = '#64748B';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Notice: ${data.note}`, 95, 1215);
  ctx.font = '11px monospace';
  ctx.fillText('SHA-256 HASH VERIFICATION ENABLED • MULTIMODAL EXTRACTION READY', 95, 1245);

  // Footer Note
  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px sans-serif';
  ctx.fillText('AuditFlow Commercial Benchmark Artifact • Generated for Autonomous AP Verification', 70, 1420);

  return { canvas, filename: data.filename };
}

export function downloadSampleInvoice(sampleKey) {
  const { canvas, filename } = renderInvoiceToCanvas(sampleKey);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
