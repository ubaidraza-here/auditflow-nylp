import React, { useState } from 'react';
import { downloadSampleInvoice } from '../../utils/sampleInvoiceGenerator';

export default function SampleInvoiceStrip() {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = (key) => {
    setDownloading(key);
    downloadSampleInvoice(key);
    setTimeout(() => setDownloading(null), 800);
  };

  return (
    <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#0A2540]">download</span>
          <span>Download Sample Vendor Invoices (For Live Drag &amp; Drop Testing):</span>
        </span>
        <span className="font-mono text-[10px] text-[#64748B] hidden sm:inline">
          HIGH-RES 1200x1500 PNG
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Sample 1: Overcharge */}
        <button
          type="button"
          onClick={() => handleDownload('SCENARIO_B_OVERCHARGE')}
          className="flex items-center justify-between p-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg transition-all text-left cursor-pointer group shadow-2xs"
        >
          <div className="flex flex-col min-w-0 pr-2">
            <span className="font-sans text-xs font-semibold text-[#0A2540] truncate group-hover:text-[#1E3A5F]">
              Apex_Tech_INV-9042
            </span>
            <span className="font-sans tabular-nums text-[10px] text-[#991B1B] font-semibold">
              +$450.00 Overcharge Demo
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-[#64748B] group-hover:text-[#0A2540] shrink-0">
            {downloading === 'SCENARIO_B_OVERCHARGE' ? 'check_circle' : 'file_download'}
          </span>
        </button>

        {/* Sample 2: Clean */}
        <button
          type="button"
          onClick={() => handleDownload('SCENARIO_A_CLEAN')}
          className="flex items-center justify-between p-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg transition-all text-left cursor-pointer group shadow-2xs"
        >
          <div className="flex flex-col min-w-0 pr-2">
            <span className="font-sans text-xs font-semibold text-[#0A2540] truncate group-hover:text-[#1E3A5F]">
              CloudHost_INV-8801
            </span>
            <span className="font-sans tabular-nums text-[10px] text-[#166534] font-semibold">
              $950.00 Clean Match
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-[#64748B] group-hover:text-[#0A2540] shrink-0">
            {downloading === 'SCENARIO_A_CLEAN' ? 'check_circle' : 'file_download'}
          </span>
        </button>

        {/* Sample 3: Duplicate */}
        <button
          type="button"
          onClick={() => handleDownload('SCENARIO_C_DUPLICATE')}
          className="flex items-center justify-between p-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg transition-all text-left cursor-pointer group shadow-2xs"
        >
          <div className="flex flex-col min-w-0 pr-2">
            <span className="font-sans text-xs font-semibold text-[#0A2540] truncate group-hover:text-[#1E3A5F]">
              PrimeOffice_INV-7710
            </span>
            <span className="font-sans tabular-nums text-[10px] text-[#92400E] font-semibold">
              $1,200.00 Duplicate Risk
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-[#64748B] group-hover:text-[#0A2540] shrink-0">
            {downloading === 'SCENARIO_C_DUPLICATE' ? 'check_circle' : 'file_download'}
          </span>
        </button>
      </div>
    </div>
  );
}
