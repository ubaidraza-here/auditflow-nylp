import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export default function DisputeEmailModal({ isOpen, onClose, invoice, onConfirmRejection }) {
  if (!isOpen || !invoice) return null;

  const discrepancies = invoice.discrepancies || [];
  const varianceTotal = discrepancies.reduce((s, d) => s + (d.financial_impact || 0), 0) || 450.0;
  const poAmount = invoice.matched_purchase_order?.authorized_total || 2500.0;
  const billedAmount = invoice.grand_total || 2950.0;
  const poRef = invoice.po_reference || 'PO-2026-102';
  const vendorName = invoice.vendor_name || 'Apex Tech Solutions';
  const vendorEmail = invoice.extracted_data?.vendor_email || 'billing@apextech.com';

  const formatUsd = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);

  const initialSubject = `Invoice Discrepancy & Credit Memo Request — ${invoice.invoice_number || 'INV-9042'} (${vendorName})`;

  const itemizedList = discrepancies.length > 0
    ? discrepancies.map((d, i) => `${i + 1}. ${d.title}: ${d.explanation} (${formatUsd(d.financial_impact)} variance)`).join('\n')
    : `1. Unit Price Variance: Billed $250.00/unit vs $210.00 contracted rate (+$400.00).\n2. Unapproved Surcharge: Expedited fee without PO authorization (+$50.00).`;

  const initialBody = `Dear ${vendorName} Accounts Receivable,\n\nOur automated 3-way reconciliation audit on invoice #${invoice.invoice_number || 'INV-9042'} identified variances against contracted Purchase Order ${poRef}:\n\n${itemizedList}\n\nSummary of Reconciled Figures:\n• Contracted Baseline: ${formatUsd(poAmount)}\n• Billed Total: ${formatUsd(billedAmount)}\n• Net Preventable Variance: +${formatUsd(varianceTotal)}\n\nIn accordance with our procurement audit policy, payment disbursement has been placed on administrative hold. Please submit an amended invoice matching the authorized total of ${formatUsd(poAmount)}, or issue a formal credit memorandum for ${formatUsd(varianceTotal)}.\n\nRegards,\nUbaid Raza — Senior AP Auditor\nTreasury & Accounts Payable Governance`;

  const [subject, setSubject] = useState(initialSubject);
  const [letterBody, setLetterBody] = useState(initialBody);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`SUBJECT: ${subject}\n\n${letterBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    onConfirmRejection({
      justification_notes: `Formally rejected invoice #${invoice.invoice_number} and committed dispute notice to ${vendorName} for +${formatUsd(varianceTotal)} variance.`,
    });
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, top: 0, left: 0, right: 0, bottom: 0, margin: 0, zIndex: 9999 }}
      className="fixed inset-0 z-[9999] m-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0A2540] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#F43F5E] text-[22px]">gavel</span>
            <div>
              <h2 className="text-sm font-semibold tracking-wide font-sans">Formal Vendor Dispute Memorandum</h2>
              <span className="font-mono text-[10px] text-slate-300">DISPATCH RECIPIENT: {vendorEmail}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
          <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#9F1239] block">Total Intercepted Leakage</span>
              <span className="font-sans tabular-nums text-base font-bold text-[#9F1239]">+{formatUsd(varianceTotal)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-[#64748B] block">Authorized PO Ceiling</span>
              <span className="font-sans tabular-nums text-sm font-semibold text-[#0F172A]">{formatUsd(poAmount)}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[#475569] block mb-1">Notice Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2 text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#0A2540] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[#475569] block mb-1">Formal Memorandum Body</label>
            <textarea
              rows={9}
              value={letterBody}
              onChange={(e) => setLetterBody(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-4 font-sans text-xs leading-relaxed text-[#1E293B] focus:bg-white focus:border-[#0A2540] focus:outline-none resize-none transition-colors"
            />
          </div>
        </div>

        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between font-sans">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            <span>{copied ? 'Copied' : 'Copy Notice Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#475569] hover:text-[#0A2540] hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-[#9F1239] hover:bg-[#881337] text-white rounded-lg px-5 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Confirm Rejection &amp; Log to Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
