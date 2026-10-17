import React, { useState } from 'react';
import { UserCheck, ShieldAlert, CheckCircle, Send, RotateCcw, FileText } from 'lucide-react';
import StatusTag from '../../components/common/StatusTag';

export default function HumanDecisionBar({
  invoice,
  onApproveClean,
  onApproveOverride,
  onOpenDispute,
  onResetState,
  onViewAuditTrail
}) {
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  const isDecided = ['APPROVED_CLEAN', 'APPROVED_WITH_OVERRIDE', 'REJECTED_DISPUTED'].includes(invoice?.status);

  if (isDecided) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#F1F5F9] gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#0A2540] uppercase tracking-wider">
              Forensic Disposition Recorded
            </span>
            <StatusTag status={invoice.status} />
          </div>
          <span className="text-[11px] font-mono text-[#64748B]">
            Reviewed by {invoice.reviewer_name || 'Ubaid Raza'}
          </span>
        </div>

        {invoice.override_reason && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-2.5 mb-3 text-xs text-[#334155]">
            <span className="font-semibold text-[#0A2540]">Auditor Override Justification: </span>
            {invoice.override_reason}
          </div>
        )}

        {invoice.dispute_memo && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] p-2.5 mb-3 text-xs text-[#991B1B]">
            <span className="font-semibold">Vendor Credit Memo Demand: </span>
            Formal notice dispatched to billing@apextech.com.
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={onResetState}
            className="text-xs font-semibold text-[#991B1B] hover:text-[#7F1D1D] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
          <button
            onClick={onViewAuditTrail}
            className="bg-[#0A2540] hover:bg-[#1E3A5F] text-white text-xs font-semibold px-4 py-2 rounded-[4px] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Immutable Audit Trail</span>
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const isFlagged = invoice?.status === 'EXCEPTION_FLAGGED';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#0A2540]" />
          <span className="font-mono text-xs font-bold text-[#0A2540] uppercase tracking-wider">
            Human-in-the-Loop Auditor Decision Console
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#64748B]">
          Auditor: <strong>Ubaid Raza</strong> (Controller)
        </span>
      </div>

      {isFlagged ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => setShowOverrideInput(!showOverrideInput)}
              className="w-full sm:w-auto border border-[#CBD5E1] hover:border-[#0A2540] bg-white text-[#334155] text-xs font-semibold px-4 py-2 rounded-[4px] shadow-2xs transition-colors cursor-pointer"
            >
              {showOverrideInput ? 'Hide Override Console' : 'Approve with Override Justification...'}
            </button>
            <button
              onClick={onOpenDispute}
              className="w-full sm:w-auto bg-[#9F1239] hover:bg-[#881337] text-white text-xs font-semibold px-5 py-2 rounded-[4px] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Reject &amp; Draft Vendor Credit Memo</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {showOverrideInput && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-3 space-y-2 animate-in fade-in duration-100">
              <label className="text-[11px] font-mono text-[#475569] font-semibold block">
                MANDATORY STATUTORY OVERRIDE JUSTIFICATION (MIN 10 CHARACTERS):
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Approved by VP Logistics for emergency supply chain expedited freight."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#0A2540]"
              />
              <div className="flex justify-end">
                <button
                  disabled={overrideReason.trim().length < 10}
                  onClick={() => onApproveOverride(overrideReason)}
                  className="bg-[#0A2540] hover:bg-[#1E3A5F] disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-[4px] shadow-xs cursor-pointer"
                >
                  Confirm Statutory Override &amp; Clear
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={onApproveClean}
            className="bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold px-5 py-2.5 rounded-[4px] shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve Clean &amp; Clear for Disbursement</span>
          </button>
        </div>
      )}
    </div>
  );
}
