import React from 'react';

export default function LineItemReconcileTable({ comparisons = [], matchedPo, invoiceNumber = 'INV-9042' }) {
  const formatUsd = (num) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);

  const poNumber = matchedPo?.po_number || 'PO-2026-102';
  const authorizedTotal = matchedPo?.authorized_total || 2500.0;
  const billedTotal = comparisons.reduce((sum, c) => sum + (c.invoice_line_total || 0), 0) || 2950.0;
  const leakageTotal = comparisons.reduce((sum, c) => sum + (c.variance_amount || 0), 0) || Math.max(0, billedTotal - authorizedTotal);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#E2E8F0]">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
          3-Way Reconciliation Matrix: {poNumber} vs {invoiceNumber}
        </span>
        <span className="font-sans text-[11px] text-[#64748B]">
          ERP Status: Baseline Linked
        </span>
      </div>

      <div className="border border-[#E2E8F0] rounded-lg overflow-x-auto bg-white shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 select-none">
              <th className="py-2.5 px-3.5">Line Item &amp; PO Mapping</th>
              <th className="py-2.5 px-3 text-center">Qty (PO vs Inv)</th>
              <th className="py-2.5 px-3 text-right">Unit Rate (PO vs Inv)</th>
              <th className="py-2.5 px-3 text-right">Net Variance</th>
              <th className="py-2.5 px-3.5 text-right">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] text-xs">
            {comparisons.map((item, idx) => {
              const isMatch = item.line_status === 'MATCH';
              const isOvercharge = item.line_status === 'OVERCHARGE';
              const isUnapproved = item.line_status === 'UNAPPROVED_ITEM';
              const isDup = item.line_status === 'DUPLICATE';

              return (
                <tr key={item.line_number || idx} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="font-sans text-xs font-semibold text-[#0A2540]">{item.invoice_description}</div>
                    <div className="text-[10px] text-[#64748B]">
                      {item.matched_po_description
                        ? <span>PO Line 0{item.line_number} • {item.matched_po_description}</span>
                        : <span className="text-[#92400E] font-semibold font-mono">[Not on {poNumber}]</span>}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-sans tabular-nums font-semibold text-[#0A2540]">
                    {item.po_quantity === item.invoice_quantity
                      ? `${item.po_quantity} = ${item.invoice_quantity}`
                      : `${item.po_quantity} → ${item.invoice_quantity}`}
                  </td>

                  <td className="py-3 px-3 text-right whitespace-nowrap font-sans tabular-nums">
                    {item.po_unit_price !== item.invoice_unit_price ? (
                      <>
                        <span className="line-through text-slate-400 mr-1.5 font-normal">
                          {formatUsd(item.po_unit_price)}
                        </span>
                        <span className="text-[#9F1239] font-semibold tracking-tight">
                          {formatUsd(item.invoice_unit_price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[#166534] font-medium">
                        {formatUsd(item.invoice_unit_price)}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-sans tabular-nums font-semibold whitespace-nowrap">
                    {item.variance_amount > 0 ? (
                      <span className="text-[#9F1239] tracking-tight">+{formatUsd(item.variance_amount)}</span>
                    ) : (
                      <span className="text-[#166534] font-medium">$0.00</span>
                    )}
                  </td>

                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    {isMatch && (
                      <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                        <span>Exact Match</span>
                      </span>
                    )}
                    {isOvercharge && (
                      <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        <span>Overcharge</span>
                      </span>
                    )}
                    {isUnapproved && (
                      <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                        <span>Unapproved</span>
                      </span>
                    )}
                    {isDup && (
                      <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        <span>Duplicate</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Calm Summary Footer */}
          <tfoot>
            <tr className="bg-[#F8FAFC] border-t border-[#E2E8F0] font-sans text-xs">
              <td className="py-3 px-3.5" colSpan={2}>
                <span className="text-[#64748B] text-[10px] uppercase block font-semibold">Authorized PO Total:</span>
                <span className="font-sans tabular-nums text-sm font-semibold text-[#0A2540]">{formatUsd(authorizedTotal)}</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-[#64748B] text-[10px] uppercase block font-semibold">Billed Inv Total:</span>
                <span className="font-sans tabular-nums text-sm font-semibold text-[#0A2540]">{formatUsd(billedTotal)}</span>
              </td>
              <td className="py-3 px-3.5 text-right" colSpan={2}>
                <span className="text-[#9F1239] uppercase text-[10px] block font-semibold">Preventable Capital Leakage:</span>
                <span className="font-sans tabular-nums text-sm font-semibold text-[#9F1239]">
                  {leakageTotal > 0 ? `+${formatUsd(leakageTotal)}` : '$0.00'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
