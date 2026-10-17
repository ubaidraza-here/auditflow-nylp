import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Send, X, ShieldCheck, Lock } from 'lucide-react';
import TabularCurrency from '../../components/common/TabularCurrency';

export default function DisputeEmailModal({ isOpen, onClose, invoice, onConfirmDispute }) {
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState(
    `Invoice Discrepancy & Credit Memo Request — ${invoice?.invoice_number || 'INV-9042'} (${invoice?.vendor_name || 'Apex Tech Solutions'})`
  );
  const [body, setBody] = useState(
    `Dear Accounts Payable & Billing Team,\n\nFollowing automated 3-way forensic reconciliation between Purchase Order ${invoice?.po_reference || 'PO-2026-102'} and Tax Invoice #${invoice?.invoice_number || 'INV-9042'}, disbursement has been placed on administrative hold due to contracted cost variances totaling +$${(invoice?.total_variance_amount || 450).toFixed(2)} USD:\n\n1. Unit Price Overrun on Line 01 (27-inch IPS Monitor Panel): Contracted unit rate under ${invoice?.po_reference || 'PO-2026-102'} is $210.00 per unit for 10 units ($2,100.00 authorized). Extracted billed rate is $250.00 per unit ($2,500.00 billed), representing an unauthorized +$400.00 (+19.05%) price variance.\n2. Unapproved Surcharge on Line 03 (Rush Delivery & Handling Fee): Surcharge of $50.00 is uncontracted and absent from requisition ${invoice?.po_reference || 'PO-2026-102'} line items.\n\nIn accordance with our enterprise vendor agreement and zero-variance disbursement policy, please issue an amended tax invoice reflecting authorized total $${(invoice?.po_baseline_grand_total || 2500).toFixed(2)} USD, or provide a formal Credit Memorandum for $${(invoice?.total_variance_amount || 450).toFixed(2)} within 5 business days.\n\nSincerely,\nAccounts Payable Audit & Disbursement Governance`
  );

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, top: 0, left: 0, right: 0, bottom: 0, margin: 0, zIndex: 9999 }}
      className="flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="max-w-2xl w-full bg-white rounded-xl border border-[#E2E8F0] shadow-2xl overflow-hidden font-sans my-auto">
        {/* Modal Header */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-[#0A2540] flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs">
              AF
            </div>
            <div>
              <h2 className="text-[#0A2540] font-semibold text-base leading-tight">
                Vendor Discrepancy &amp; Credit Memo Notice
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 font-mono">
                Reconciliation Reference: <span className="font-semibold text-slate-700">#{invoice?.invoice_number}</span> • <span className="font-semibold text-slate-700">{invoice?.po_reference}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] px-2.5 py-1 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 shadow-2xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              <span>Disputed: +${(invoice?.total_variance_amount || 450).toFixed(2)}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        {/* 3-Column Metadata Strip */}
        <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-white border-b border-[#F1F5F9] text-xs">
          <div>
            <div className="text-[10px] tracking-wider text-[#64748B] font-semibold uppercase font-mono">RECIPIENT VENDOR</div>
            <div className="font-semibold text-[#0F172A] mt-0.5">{invoice?.vendor_name}</div>
            <div className="font-mono text-slate-500 text-[11px] truncate">{invoice?.vendor_email}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[#64748B] font-semibold uppercase font-mono">CONTRACT BASELINE</div>
            <div className="font-mono font-semibold text-[#0F172A] mt-0.5">{invoice?.po_reference}</div>
            <div className="font-sans tabular-nums text-slate-500 text-[11px]">(${invoice?.po_baseline_grand_total?.toFixed(2)} Authorized)</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[#64748B] font-semibold uppercase font-mono">AUDIT DISPOSITION</div>
            <div className="font-semibold text-[#9F1239] mt-0.5">Hold Payment &amp; Credit Memo</div>
            <div className="text-slate-500 text-[11px]">Net 30 Clock Suspended</div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-4 space-y-3 bg-white">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider font-mono block mb-1">
              FORMAL SUBJECT LINE
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-xs font-medium text-[#0F172A] w-full focus:outline-none focus:ring-1 focus:ring-[#0A2540]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider font-mono block mb-1">
              DISPATCH MEMORANDUM
            </label>
            <textarea
              rows="7"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-xs leading-relaxed text-[#1E293B] resize-none font-sans focus:outline-none focus:ring-1 focus:ring-[#0A2540]"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#475569]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-[#0A2540] rounded" />
              <span className="font-medium text-slate-700 text-xs">
                Attach signed PDF forensic proof sheet (<span className="font-mono">SHA-256</span> verified)
              </span>
            </label>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
              <Lock className="w-3 h-3 text-[#16A34A]" />
              <span>TLS 1.3 / S/MIME</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#0F172A] rounded-lg px-3.5 py-2 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Notice Text'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="hover:bg-slate-100 text-[#475569] px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirmDispute(subject, body);
                onClose();
              }}
              className="bg-[#9F1239] hover:bg-[#881337] text-white rounded-lg px-5 py-2 text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Confirm Rejection &amp; Log to Audit</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
