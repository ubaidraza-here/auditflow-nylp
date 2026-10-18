import React from 'react';
import { useNavigate } from 'react-router-dom';

const CASES = [
  { id: 'inv_1002', label: 'INV-9042', tag: '(+$450 Overrun)' },
  { id: 'inv_1001', label: 'INV-8801', tag: '(Clean Match)' },
  { id: 'inv_1003', label: 'INV-7710-REV', tag: '(Duplicate)' },
];

export default function WorkbenchCaseHeader({ invoice, onResetCase, onExport }) {
  const navigate = useNavigate();

  const isAnomaly =
    invoice.status === 'EXCEPTION_FLAGGED' || invoice.status === 'REJECTED_DISPUTED';
  const isClean = invoice.status === 'VERIFIED_MATCH';
  const isApproved =
    invoice.status === 'APPROVED_CLEAN' || invoice.status === 'APPROVED_WITH_OVERRIDE';

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Left: Back Button & Title */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#CBD5E1] text-[#0A2540] hover:bg-[#F8FAFC] transition-colors font-sans text-xs font-semibold cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          <span>Back to Queue</span>
        </button>

        <div className="h-4 w-px bg-[#CBD5E1] hidden sm:block" />

        <div className="flex items-center gap-2 flex-wrap font-sans">
          <h1 className="text-sm font-bold text-[#0A2540]">
            Case #{invoice.invoice_number} — {invoice.vendor_name}
          </h1>
          <span className="font-mono text-[10px] bg-[#F8FAFC] px-2 py-0.5 rounded-[4px] border border-[#E2E8F0] text-[#64748B]">
            SHA-256: {invoice.file_hash_sha256 ? `${invoice.file_hash_sha256.substring(0, 8)}...` : 'e3b0c442...'}
          </span>
        </div>
      </div>

      {/* Center: Segmented Case Switcher */}
      <div className="inline-flex items-center bg-[#F4F6F8] p-1 rounded-lg border border-[#E2E8F0] font-sans text-xs overflow-x-auto">
        {CASES.map((c) => {
          const isActive =
            invoice.invoice_id === c.id ||
            invoice.invoice_number?.includes(c.id.replace('inv_', ''));
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/workbench/${c.id}`)}
              className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#0A2540] text-white shadow-xs font-semibold'
                  : 'text-[#475569] hover:text-[#0A2540] hover:bg-white/60'
              }`}
            >
              <span className="font-mono text-xs">{c.label}</span>
              <span className={`text-[10px] font-sans tabular-nums ${isActive ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                {c.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Export, Reset Action & Status Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1 font-sans text-xs text-[#0A2540] hover:bg-[#F8FAFC] px-2.5 py-1.5 border border-[#CBD5E1] bg-white rounded-md transition-colors cursor-pointer shadow-xs font-medium"
            title="Export Cryptographic Forensic JSON Dossier"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            <span>Export Record</span>
          </button>
        )}

        <button
          type="button"
          onClick={onResetCase}
          className="font-sans text-xs text-[#64748B] hover:text-[#0A2540] px-2.5 py-1.5 border border-[#CBD5E1] bg-white rounded-md transition-colors cursor-pointer shadow-xs font-medium"
        >
          Reset Demo State
        </button>

        {isAnomaly && (
          <div className="rounded-[4px] px-2.5 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
            <span>
              {invoice.status === 'REJECTED_DISPUTED'
                ? 'Dispute Dispatched'
                : 'Exception Flagged'}
            </span>
          </div>
        )}

        {isClean && (
          <div className="rounded-[4px] px-2.5 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>Verified 3-Way Match</span>
          </div>
        )}

        {isApproved && (
          <div className="rounded-[4px] px-2.5 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            <span>
              {invoice.status === 'APPROVED_WITH_OVERRIDE'
                ? 'Approved with Override'
                : 'Approved Clean Match'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
