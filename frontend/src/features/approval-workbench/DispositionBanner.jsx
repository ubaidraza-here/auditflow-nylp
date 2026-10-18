import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DispositionBanner({ invoice, onResetDemo, onExport }) {
  const navigate = useNavigate();
  const status = invoice?.status;
  const isTerminal =
    status === 'REJECTED_DISPUTED' ||
    status === 'APPROVED_CLEAN' ||
    status === 'APPROVED_WITH_OVERRIDE';

  if (!isTerminal) return null;

  const isRejected = status === 'REJECTED_DISPUTED';
  const meta = invoice?.decision_metadata || {};
  const reviewer = meta.reviewer_name || 'Ubaid Raza — Senior AP Forensic Auditor';

  const formatUsd = (num) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);

  const savedAmount =
    invoice?.discrepancies?.reduce((acc, d) => acc + (d.financial_impact || 0), 0) || 450.0;

  return (
    <div
      className={`border rounded-lg p-4 shadow-xs transition-all ${
        isRejected
          ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
          : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
              isRejected ? 'bg-[#9F1239] text-white' : 'bg-[#059669] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isRejected ? 'gavel' : 'verified'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider">
                {isRejected
                  ? 'Terminal Resolution: Dispute Dispatched • Payment Suspended'
                  : 'Terminal Resolution: Approved • Released to Treasury ERP'}
              </h3>
              <span className={`rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium tracking-tight inline-flex items-center gap-1.5 border uppercase bg-white ${
                isRejected ? 'text-[#991B1B] border-[#FECACA]' : 'text-[#166534] border-[#BBF7D0]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isRejected ? 'bg-[#DC2626]' : 'bg-[#16A34A]'}`} />
                <span>{status}</span>
              </span>
            </div>
            <div className="font-sans text-xs mt-1 space-x-2 text-[#475569]">
              <span>Auditor: <strong className="text-[#0A2540]">{reviewer}</strong></span>
              <span>•</span>
              {isRejected ? (
                <span className="font-sans tabular-nums text-[#9F1239] font-bold">
                  Intercepted Leakage: +{formatUsd(savedAmount)}
                </span>
              ) : (
                <span className="font-sans tabular-nums text-[#065F46] font-bold">
                  Authorized Total: {formatUsd(invoice.grand_total)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          <button
            type="button"
            onClick={() => navigate('/audit-logs')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-xs font-medium bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0A2540] transition-colors cursor-pointer shadow-xs"
          >
            <span>View Audit Trail</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-sans text-xs font-medium bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0A2540] cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>Export Record</span>
            </button>
          )}
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-xs font-semibold bg-[#0A2540] hover:bg-[#1E3A5F] text-white transition-colors cursor-pointer shadow-xs"
            title="Reset this case back to un-audited state"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            <span>Reset State</span>
          </button>
        </div>
      </div>
    </div>
  );
}
