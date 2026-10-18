import React from 'react';

export default function TableFooterBar({ totalCount, currentCount, onSelectAll, onBulkExport }) {
  return (
    <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs text-[#64748B]">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          <span>
            Showing <strong className="text-[#0A2540] font-semibold">{currentCount} of {totalCount}</strong> Records
          </span>
        </span>
        <span className="h-3 w-px bg-[#CBD5E1] hidden sm:block" />
        <span className="text-[#94A3B8] hidden md:inline">Ledger Hash: 0x9f4a...3c2e</span>
        <span className="h-3 w-px bg-[#CBD5E1] hidden sm:block" />
        <span className="text-[#065F46] font-medium">ERP Sync: Active</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          className="px-2.5 py-1 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0A2540] transition-colors cursor-pointer text-xs font-medium"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={onBulkExport}
          className="px-2.5 py-1 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0A2540] transition-colors cursor-pointer text-xs font-medium"
        >
          Bulk Export
        </button>
        <button
          type="button"
          onClick={() => alert('Triggering Gemini 3.5 Automated Batch Re-Evaluation on queue records...')}
          className="px-3 py-1 rounded bg-[#0A2540] hover:bg-[#1E3A5F] text-white transition-colors cursor-pointer font-sans text-xs font-semibold shadow-xs"
        >
          Run Batch Verification
        </button>
      </div>
    </div>
  );
}
