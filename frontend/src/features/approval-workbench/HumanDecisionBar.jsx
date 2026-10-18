import React, { useState } from 'react';
import { Send } from 'lucide-react';
export default function HumanDecisionBar({ invoice, onApproveClean, onOpenDispute, onOverrideApprove, onExport }) {
  const [reason, setReason] = useState('');
  const status = invoice?.status;
  const isTerminal =
    status === 'APPROVED_CLEAN' ||
    status === 'APPROVED_WITH_OVERRIDE' ||
    status === 'REJECTED_DISPUTED';

  const handleOverride = () => {
    if (!reason.trim()) {
      alert('Mandatory justification note is required before overriding flagged exceptions.');
      return;
    }
    onOverrideApprove(reason.trim());
    setReason('');
  };

  if (isTerminal) {
    return (
      <div className="bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-sm flex flex-col gap-3 font-sans">
        <div className="flex flex-wrap items-center justify-between text-xs border-b border-[#F1F5F9] pb-2 text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#0A2540]">lock</span>
            <span className="text-[#0A2540] font-semibold">Terminal Disposition Committed</span>
            <span>— {status}</span>
          </div>
          <div className="font-mono text-[11px] text-[#059669] font-semibold">
            Immutable Ledger Record Committed
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[#475569]">
            Case record is locked and cryptographically written to the audit trail.
          </p>
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="px-3.5 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0A2540] rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              Export JSON Package
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-sm flex flex-col gap-3 font-sans">
      {/* Reviewer Credential Row */}
      <div className="flex flex-wrap items-center justify-between text-xs border-b border-[#F1F5F9] pb-2 text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#0A2540]">badge</span>
          <span className="text-[#0A2540] font-semibold">Ubaid Raza</span>
          <span>• Senior AP Auditor</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span className="material-symbols-outlined text-[13px] text-[#059669]">lock_clock</span>
          <span>Session: 2026-10-14 14:32:08 UTC</span>
        </div>
      </div>

      {status === 'VERIFIED_MATCH' ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onApproveClean}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white px-5 py-2.5 rounded-lg font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Approve Clean Invoice &amp; Release to ERP →</span>
          </button>
          <p className="font-mono text-[10px] text-[#64748B] text-center">
            Zero-touch 3-way match confirmed against contracted PO. Immediate release to treasury payment run.
          </p>
        </div>
      ) : (
        <>
          {/* Audit Note Justification & Override */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mandatory justification note before override or disbursement release..."
              className="bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#0A2540] placeholder-[#94A3B8] px-3 py-2 rounded-md flex-1 font-sans focus:bg-white focus:outline-none focus:border-[#0A2540] transition-colors"
            />
            <button
              type="button"
              onClick={handleOverride}
              className="border border-[#0A2540] text-[#0A2540] hover:bg-[#F1F5F9] px-3.5 py-2 font-sans text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer"
            >
              Approve with Override
            </button>
          </div>

          {/* Primary High-Contrast Disputed Action */}
          <div>
            <button
              type="button"
              onClick={onOpenDispute}
              className="w-full bg-[#9F1239] hover:bg-[#881337] text-white px-5 py-2.5 rounded-lg font-sans text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <span>Reject &amp; Draft Vendor Credit Memo</span>
              <Send className="w-3.5 h-3.5" />
            </button>

            <p className="font-mono text-[10px] text-[#64748B] text-center mt-1.5">
              Generates formal corporate credit memo with contract references and dispatch log.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
