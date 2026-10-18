import React from 'react';

export default function InvoiceLedgerRow({ invoice, isSelected, onToggleSelect, onInspect }) {
  const isUnresolvedFlagged = ['EXCEPTION_FLAGGED', 'NEEDS_REVIEW', 'FLAGGED'].includes(invoice.status);
  const isClean = ['MATCHED_APPROVED', 'AUTO_APPROVED', 'APPROVED', 'VERIFIED_MATCH', 'APPROVED_CLEAN', 'Approved Clean'].includes(invoice.status) && (invoice.discrepancies?.length || 0) === 0 && Math.abs(Number(invoice.total_variance_amount || invoice.variance_amount || 0)) === 0;
  const isArchive = ['APPROVED_CLEAN', 'APPROVED_WITH_OVERRIDE', 'REJECTED_DISPUTED', 'REJECTED', 'ARCHIVED'].includes(invoice.status) || Boolean(invoice.decision_metadata && !isClean);
  const isDisputed = ['REJECTED_DISPUTED', 'DISPUTED', 'REJECTED'].includes(invoice.status);
  const isOverride = ['APPROVED_WITH_OVERRIDE', 'APPROVED_OVERRIDE'].includes(invoice.status);
  const borderStripe = isUnresolvedFlagged ? 'border-l-4 border-l-rose-600' : isClean ? 'border-l-4 border-l-emerald-600' : 'border-l-4 border-l-transparent';

  const poAmount = invoice.matched_purchase_order?.authorized_total || invoice.grand_total;
  const billedAmount = invoice.grand_total || 0;
  const invNum = String(invoice.invoice_number || '').toUpperCase();
  const flagR = String(invoice.flag_reason || '').toUpperCase();
  const discs = invoice.discrepancies || [];
  const isDuplicate = invNum.includes('-REV') || flagR.includes('DUPLICATE') || discs.some(d => String(d.rule_code || '').toUpperCase().includes('DUPLICATE'));
  const rawVar = Number(invoice.total_variance_amount || invoice.variance_amount || (billedAmount - poAmount));
  const effectiveVariance = isDuplicate ? billedAmount : Math.max(0, rawVar);
  const confidence = Math.round((invoice.extraction_confidence || 0.95) * 100);
  const formatUsd = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num || 0);

  return (
    <tr className={`group hover:bg-[#F8FAFC] transition-colors ${borderStripe} bg-white`}>
      <td className={`py-3 px-4 text-center ${borderStripe}`}>
        <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(invoice.invoice_id)} className="rounded border-[#CBD5E1] text-[#0A2540] focus:ring-0 cursor-pointer" />
      </td>

      <td className="py-3 px-4 font-mono text-xs font-semibold text-[#0A2540]">
        <div className="flex items-center gap-1.5">
          <span>{invoice.invoice_number}</span>
          {isUnresolvedFlagged && <span className="w-1.5 h-1.5 rounded-full bg-rose-600" title="Exception flagged" />}
          {isClean && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="Verified clean" />}
          {isArchive && <span className="material-symbols-outlined text-[#94A3B8] text-[13px]">lock</span>}
        </div>
        <span className="font-mono text-[10px] text-[#94A3B8] block">ID: {invoice.file_hash_sha256 ? `0x${invoice.file_hash_sha256.substring(0, 6)}...` : '0x8a92b...'}</span>
      </td>

      <td className="py-3 px-4">
        <div className="font-sans text-xs font-semibold text-[#0A2540]">{invoice.vendor_name}</div>
        <div className="font-mono text-[11px] text-[#64748B]">{invoice.extracted_data?.vendor_tax_id || 'NTN-8839201-4'} • {invoice.extracted_data?.iban_or_account ? `${invoice.extracted_data.iban_or_account.substring(0, 8)}...` : 'PK36SCBL...'}</div>
      </td>

      <td className="py-3 px-4 font-mono text-xs text-[#475569]">
        <div>{invoice.po_reference || 'PO-2026-102'}</div>
        <span className="block font-sans text-[10px] text-[#94A3B8]">{isArchive ? 'Closed Order' : 'Line Requisition'}</span>
      </td>

      <td className="py-3 px-4 font-mono text-xs text-[#64748B] whitespace-nowrap">
        {invoice.invoice_date || '2026-10-14'}
        <span className="block text-[10px] text-[#94A3B8]">14:22 UTC</span>
      </td>

      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="font-sans tabular-nums text-xs text-[#0A2540] font-semibold tracking-tight">{formatUsd(billedAmount)}</div>
        <div className="font-sans tabular-nums text-[11px] font-normal text-slate-400 line-through">{formatUsd(poAmount)} PO</div>
      </td>

      {/* Variance Delta */}
      <td className="py-3 px-4 text-right whitespace-nowrap font-sans tabular-nums">
        {isDuplicate ? (
          <>
            <span className="text-xs font-semibold tracking-tight text-[#9F1239]">+{formatUsd(billedAmount)}</span>
            <span className="block text-[10px] text-[#9F1239] font-sans font-semibold">100% Duplicate</span>
          </>
        ) : effectiveVariance > 0 ? (
          <>
            <span className="text-xs font-semibold tracking-tight text-[#9F1239]">+{formatUsd(effectiveVariance)}</span>
            <span className="block text-[10px] text-[#9F1239] font-sans font-semibold">+{((effectiveVariance / (poAmount || 1)) * 100).toFixed(1)}% Overrun</span>
          </>
        ) : isOverride ? (
          <>
            <span className="text-xs font-semibold tracking-tight text-[#0284C7]">Override</span>
            <span className="block text-[10px] text-[#0284C7] font-sans font-medium">Variance Waived</span>
          </>
        ) : isDisputed ? (
          <>
            <span className="text-xs font-semibold tracking-tight text-[#9F1239]">Blocked</span>
            <span className="block text-[10px] text-[#9F1239] font-sans font-medium">Dispute Memo Filed</span>
          </>
        ) : isUnresolvedFlagged ? (
          <>
            <span className="text-xs font-semibold tracking-tight text-[#9F1239]">On Hold</span>
            <span className="block text-[10px] text-[#9F1239] font-sans font-medium">Exception Review</span>
          </>
        ) : (
          <>
            <span className="text-xs font-semibold tracking-tight text-[#475569]">$0.00</span>
            <span className="block text-[10px] text-[#059669] font-sans font-medium">{invoice.status === 'APPROVED_CLEAN' ? 'Disbursed' : '100% Parity'}</span>
          </>
        )}
      </td>

      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="font-sans tabular-nums text-xs font-semibold tracking-tight text-[#0A2540]">{confidence}%</span>
          <div className="w-12 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div className="bg-[#0A2540] h-full" style={{ width: `${confidence}%` }} />
          </div>
        </div>
        <span className="font-sans text-[10px] text-[#94A3B8]">Gemini 3.5 Vision</span>
      </td>

      <td className="py-3 px-4 whitespace-nowrap">
        {isUnresolvedFlagged && (
          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium tracking-tight inline-flex items-center gap-1.5 border bg-rose-50 text-rose-800 border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Exception Flagged: {invoice.discrepancy_count || invoice.discrepancies?.length || 1}</span>
          </span>
        )}
        {isClean && (
          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>Verified 3-Way Match</span>
          </span>
        )}
        {isArchive && (
          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            <span>{isDisputed ? 'Dispute Memo Filed' : isOverride ? 'Override Audit' : 'Approved Clean'}</span>
          </span>
        )}
      </td>

      <td className="py-3 px-4 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => onInspect(invoice.invoice_id)}
          className="px-3 py-1 bg-white hover:bg-[#0A2540] hover:text-white border border-[#CBD5E1] text-[#0A2540] rounded-md font-sans text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <span>Review Case</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </td>
    </tr>
  );
}
