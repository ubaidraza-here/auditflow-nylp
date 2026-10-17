import React, { useState, useMemo } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import InvoiceTableRow from './InvoiceTableRow';

export default function InvoiceQueueTable({ invoices = [], onSelectInvoice }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => ({
    ALL: invoices.length,
    FLAGGED: invoices.filter(i => i.status === 'EXCEPTION_FLAGGED').length,
    VERIFIED: invoices.filter(i => ['VERIFIED_MATCH', 'APPROVED_CLEAN'].includes(i.status)).length,
    ARCHIVED: invoices.filter(i => ['APPROVED_WITH_OVERRIDE', 'REJECTED_DISPUTED'].includes(i.status)).length,
  }), [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Tab filter
      if (activeFilter === 'FLAGGED' && inv.status !== 'EXCEPTION_FLAGGED') return false;
      if (activeFilter === 'VERIFIED' && !['VERIFIED_MATCH', 'APPROVED_CLEAN'].includes(inv.status)) return false;
      if (activeFilter === 'ARCHIVED' && !['APPROVED_WITH_OVERRIDE', 'REJECTED_DISPUTED'].includes(inv.status)) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (inv.invoice_number || '').toLowerCase().includes(q) ||
        (inv.vendor_name || '').toLowerCase().includes(q) ||
        (inv.po_reference || '').toLowerCase().includes(q) ||
        (inv.vendor_ntn || '').toLowerCase().includes(q) ||
        (inv.sha256_hash || '').toLowerCase().includes(q)
      );
    });
  }, [invoices, activeFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = ['Invoice Number', 'Vendor', 'PO Reference', 'Date', 'Billed', 'PO Baseline', 'Variance', 'Status'];
    const rows = filteredInvoices.map(i => [
      i.invoice_number,
      `"${i.vendor_name}"`,
      i.po_reference || '',
      i.invoice_date,
      i.grand_total,
      i.po_baseline_grand_total || i.grand_total,
      i.total_variance_amount || 0,
      i.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditflow_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-[6px] border border-[#E2E8F0]">
          {[
            { id: 'ALL', label: 'All Items', count: counts.ALL },
            { id: 'FLAGGED', label: 'Flagged Exceptions', count: counts.FLAGGED },
            { id: 'VERIFIED', label: 'Verified Clean', count: counts.VERIFIED },
            { id: 'ARCHIVED', label: 'Settled / Archived', count: counts.ARCHIVED },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-[4px] transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-[#0A2540] shadow-2xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0A2540]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                activeFilter === tab.id ? 'bg-[#F1F5F9] text-[#0A2540]' : 'bg-transparent text-[#94A3B8]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Search & Export */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Filter by NTN, PO#, SHA-256..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#F8FAFC] border border-[#CBD5E1] text-xs rounded-[4px] pl-8 pr-3 py-1.5 w-64 text-[#0A2540] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0A2540] transition-colors"
            />
          </div>
          <button
            onClick={handleExportCsv}
            className="border border-[#CBD5E1] hover:border-[#0A2540] bg-white text-[#0A2540] text-xs font-semibold px-3 py-1.5 rounded-[4px] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Dense Institutional Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-mono font-semibold text-[#64748B] uppercase tracking-wider">
              <th className="py-2.5 px-4">Invoice & Vendor</th>
              <th className="py-2.5 px-4">PO Baseline</th>
              <th className="py-2.5 px-4">Invoice Date</th>
              <th className="py-2.5 px-4 text-right">Billed Amount</th>
              <th className="py-2.5 px-4 text-right">PO Total</th>
              <th className="py-2.5 px-4 text-right">Variance</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <InvoiceTableRow key={inv.id} invoice={inv} onSelectInvoice={onSelectInvoice} />
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-12 text-center text-xs text-[#94A3B8]">
                  No matching invoice records located in current audit queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
