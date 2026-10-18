// HTML5 Canvas Synthetic Commercial Tax Invoice Generator for High-Res Test Files

const INVOICE_TEMPLATES = {
  INV_9042: {
    vendor: "Apex Tech Solutions Ltd.",
    ntn: "NTN-8839201-4",
    iban: "PK36SCBL00000011223344",
    email: "billing@apextech.com",
    invoiceNo: "INV-9042",
    date: "2026-10-14",
    po: "PO-2026-102",
    lines: [
      { desc: "27-inch IPS Monitor Panel (Billed @ $250 vs $210 PO)", qty: "10.0", rate: "$250.00", total: "$2,500.00" },
      { desc: "USB-C Dual 4K Docking Station", qty: "5.0", rate: "$80.00", total: "$400.00" },
      { desc: "Rush Delivery & Priority Handling Surcharge", qty: "1.0", rate: "$50.00", total: "$50.00" }
    ],
    total: "$2,950.00 USD",
    filename: "Apex_Tech_INV-9042.png"
  },
  INV_8801: {
    vendor: "CloudHost Enterprise PK",
    ntn: "NTN-4410928-1",
    iban: "PK91MEZN00010203040506",
    email: "accounts@cloudhost.pk",
    invoiceNo: "INV-8801",
    date: "2026-10-15",
    po: "PO-2026-101",
    lines: [
      { desc: "Dedicated GPU Server Instance (Monthly Retainer)", qty: "1.0", rate: "$800.00", total: "$800.00" },
      { desc: "Managed Cloud Backup Storage Volume (5TB)", qty: "1.0", rate: "$150.00", total: "$150.00" }
    ],
    total: "$950.00 USD",
    filename: "CloudHost_INV-8801.png"
  },
  INV_7710: {
    vendor: "Prime Office Logistics",
    ntn: "NTN-1129384-9",
    iban: "PK12HABB00099887766554",
    email: "billing@primeofficelogistics.com",
    invoiceNo: "INV-7710-REV",
    date: "2026-10-12",
    po: "PO-2026-103",
    lines: [
      { desc: "Ergonomic Mesh Task Chair (Re-submission Duplicate)", qty: "6.0", rate: "$200.00", total: "$1,200.00" }
    ],
    total: "$1,200.00 USD",
    filename: "PrimeOffice_INV-7710.png"
  }
};

export function renderInvoiceToCanvas(tplKey) {
  const tpl = INVOICE_TEMPLATES[tplKey] || INVOICE_TEMPLATES.INV_9042;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1200, 1500);

  // Border & Decorative Top Ribbon
  ctx.fillStyle = '#0A2540';
  ctx.fillRect(0, 0, 1200, 24);

  // Header
  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 38px Inter, sans-serif';
  ctx.fillText(tpl.vendor, 80, 120);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px monospace';
  ctx.fillText(`Tax Registration: ${tpl.ntn}`, 80, 160);
  ctx.fillText(`Remittance IBAN: ${tpl.iban}`, 80, 190);
  ctx.fillText(`Accounts: ${tpl.email}`, 80, 220);

  // Right Side Header Block
  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('TAX INVOICE', 840, 120);

  ctx.fillStyle = '#991B1B';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(tpl.invoiceNo, 840, 160);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px monospace';
  ctx.fillText(`Date: ${tpl.date}`, 840, 195);
  ctx.fillText(`PO Ref: ${tpl.po}`, 840, 225);

  // Dividing Line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 260);
  ctx.lineTo(1120, 260);
  ctx.stroke();

  // Table Header
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(80, 300, 1040, 50);
  ctx.strokeStyle = '#E2E8F0';
  ctx.strokeRect(80, 300, 1040, 50);

  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('ITEM DESCRIPTION', 100, 332);
  ctx.fillText('QTY', 660, 332);
  ctx.fillText('RATE', 800, 332);
  ctx.fillText('AMOUNT', 980, 332);

  // Table Rows
  let y = 390;
  ctx.font = '19px Inter, sans-serif';
  tpl.lines.forEach((line, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA';
    ctx.fillRect(80, y - 30, 1040, 55);
    ctx.strokeStyle = '#F1F5F9';
    ctx.strokeRect(80, y - 30, 1040, 55);

    ctx.fillStyle = '#0A2540';
    ctx.fillText(line.desc, 100, y + 5);
    ctx.font = '19px monospace';
    ctx.fillText(line.qty, 660, y + 5);
    ctx.fillText(line.rate, 800, y + 5);
    ctx.fillText(line.total, 980, y + 5);
    ctx.font = '19px Inter, sans-serif';
    y += 65;
  });

  // Total Summary
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(720, y + 40, 400, 90);
  ctx.strokeStyle = '#0A2540';
  ctx.lineWidth = 2;
  ctx.strokeRect(720, y + 40, 400, 90);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('FINAL BALANCE PAYABLE', 740, y + 75);
  ctx.fillStyle = '#0A2540';
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText(tpl.total, 740, y + 115);

  // Footer Proof Hash
  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px monospace';
  ctx.fillText('Forensic Audit Proof Document // Cryptographically Generated for AuditFlow Automated Ingestion', 80, 1440);

  return { canvas, filename: tpl.filename };
}

export function downloadSampleInvoice(tplKey) {
  const { canvas, filename } = renderInvoiceToCanvas(tplKey);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
