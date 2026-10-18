// Utility for Client-Side RFC 4180 CSV and Structured JSON Exports

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAuditLogsCsv(logs) {
  const headers = ['Log ID', 'Timestamp (UTC)', 'Invoice Number', 'Event Type', 'Auditor Actor', 'Diagnostic Details'];
  const rows = (logs || []).map(log => [
    log.id,
    log.timestamp,
    log.invoice_number || 'N/A',
    log.event_type,
    `"${log.actor || 'Ubaid Raza'}"`,
    `"${(log.details || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `auditflow_audit_trail_${Date.now()}.csv`);
}

export function exportInvoiceJson(invoice) {
  const exportPayload = {
    exported_at: new Date().toISOString(),
    platform: 'AuditFlow — Forensic AP Reconciliation Platform',
    governance_hash: invoice?.sha256_hash,
    invoice_record: invoice
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const filename = `auditflow_invoice_${invoice?.invoice_number || 'export'}_${Date.now()}.json`;
  downloadBlob(blob, filename);
}

export function exportPurchaseOrdersCsv(pos) {
  const headers = ['PO Number', 'Vendor Name', 'Vendor NTN', 'Vendor IBAN', 'Issue Date', 'Authorized Total', 'Line Items Count'];
  const rows = (pos || []).map(p => [
    p.po_number,
    `"${p.vendor_name}"`,
    p.vendor_ntn,
    p.vendor_iban,
    p.issue_date,
    p.grand_total,
    (p.lines || []).length
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `auditflow_po_baselines_${Date.now()}.csv`);
}
