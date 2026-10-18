import React, { useState } from 'react';
import InvoiceLedgerRow from './InvoiceLedgerRow';
import TableFooterBar from './TableFooterBar';
import { exportLedgerCsv } from '../../utils/exportUtils';

export default function InvoiceQueueTable({
  invoices = [],
  activeTab = 'all',
  onTabChange,
  tabCounts = { all: 6, anomalies: 2, clean: 1, archive: 3 },
  search = '',
  onSearchChange,
  onInspect,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === invoices.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(invoices.map((i) => i.invoice_id)));
  };

  const handleBulkExport = () => {
    const listToExport =
      selectedIds.size > 0
        ? invoices.filter((i) => selectedIds.has(i.invoice_id))
        : invoices;
    exportLedgerCsv(listToExport);
  };

  return (
    <section className="w-full bg-white border border-[#E2E8F0] rounded-lg shadow-card overflow-hidden flex flex-col">
      {/* Table Filter Control Bar */}
      <div className="p-4 bg-white border-b border-[#E2E8F0] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 border border-[#E2E8F0] rounded-lg p-1 bg-[#F8FAFC] overflow-x-auto">
          {[
            { id: 'all', label: `All Items (${tabCounts.all})` },
            { id: 'anomalies', label: `Flagged (${tabCounts.anomalies})`, dot: 'bg-[#9F1239]' },
            { id: 'clean', label: `Verified Clean (${tabCounts.clean})`, dot: 'bg-[#059669]' },
            { id: 'archive', label: `Archived (${tabCounts.archive})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'font-semibold text-white bg-[#0A2540] shadow-xs'
                  : 'text-[#475569] hover:text-[#0A2540] hover:bg-white/80'
              }`}
            >
              {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Export Tools */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter by NTN, IBAN, PO#, or SHA-256..."
              className="w-full pl-8 pr-8 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md font-mono text-xs text-[#0A2540] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0A2540] transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1 py-0.2 bg-white border border-[#CBD5E1] rounded text-[9px] font-mono text-[#94A3B8] pointer-events-none">
              /
            </span>
          </div>

          <button
            type="button"
            onClick={handleBulkExport}
            className="px-3.5 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-md font-sans text-xs text-[#0A2540] font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse" id="forensicLedgerTable">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 select-none">
              <th className="py-3 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={invoices.length > 0 && selectedIds.size === invoices.length}
                  onChange={handleToggleAll}
                  className="rounded border-[#CBD5E1] text-[#0A2540] focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Invoice ID</th>
              <th className="py-3 px-4">Vendor &amp; Tax Credentials</th>
              <th className="py-3 px-4">ERP PO Baseline</th>
              <th className="py-3 px-4">Ingest Date</th>
              <th className="py-3 px-4 text-right">Billed vs PO Amount</th>
              <th className="py-3 px-4 text-right">Variance Delta</th>
              <th className="py-3 px-4">AI Confidence</th>
              <th className="py-3 px-4">Forensic Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] font-sans text-xs">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center font-mono text-sm text-[#64748B]">
                  No audit records found matching current filter criteria.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <InvoiceLedgerRow
                  key={inv.invoice_id}
                  invoice={inv}
                  isSelected={selectedIds.has(inv.invoice_id)}
                  onToggleSelect={handleToggleSelect}
                  onInspect={onInspect}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Bar */}
      <TableFooterBar
        totalCount={tabCounts.all}
        currentCount={invoices.length}
        onSelectAll={handleToggleAll}
        onBulkExport={handleBulkExport}
      />
    </section>
  );
}
