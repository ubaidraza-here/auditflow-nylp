import React from 'react';

export default function InstitutionalFooter() {
  return (
    <footer className="w-full bg-[#F8FAFC] border-t border-[#E2E8F0] py-3.5 px-4 md:px-6 shrink-0 mt-auto">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[#64748B] font-mono text-xs">
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <span className="font-semibold text-[#0A2540]">AUDITFLOW INSTITUTIONAL TREASURY</span>
          <span className="h-3 w-px bg-[#CBD5E1] hidden sm:block" />
          <span className="text-[11px]">
            SOX 404 &amp; EU-CH AUDIT COMPLIANT
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#065F46] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            IMMUTABLE LEDGER VERIFIED (SHA-256)
          </span>
          <span className="h-3 w-px bg-[#CBD5E1] hidden sm:block" />
          <span className="text-[11px] text-[#9F1239] font-medium">
            DISCREPANCY TOLERANCE: 0.00%
          </span>
        </div>
      </div>
    </footer>
  );
}
