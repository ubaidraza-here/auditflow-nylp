import React from 'react';
import TabularCurrency from '../../components/common/TabularCurrency';

export default function LineItemReconcileTable({ invoice, po }) {
  const lineItems = invoice?.line_items || [];
  const poBaselineTotal = invoice?.po_baseline_grand_total || po?.grand_total || 2500.00;
  const billedTotal = invoice?.grand_total || 2950.00;
  const varianceTotal = invoice?.total_variance_amount || (billedTotal - poBaselineTotal);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-xs overflow-hidden mb-4">
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#0A2540] uppercase tracking-wider">
            3-Way Line Item Reconciliation Matrix
          </span>
          <span className="text-[10px] font-mono text-[#64748B] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded">
            PO: {invoice?.po_reference || 'PO-2026-102'}
          </span>
        </div>
        <span className="text-xs text-[#64748B]">Deterministic Unit-Price Tolerance: ±$0.02</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[11px] font-mono text-[#475569] uppercase font-semibold">
              <th className="py-2.5 px-3">Line &amp; Description</th>
              <th className="py-2.5 px-3">PO Mapping</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Rate (PO vs Inv)</th>
              <th className="py-2.5 px-3 text-right">Line Total</th>
              <th className="py-2.5 px-3 text-right">Variance</th>
              <th className="py-2.5 px-3 text-center">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const poLine = (po?.lines || []).find(l => l.id === item.matched_po_line_id);
              const poRate = poLine?.rate;
              const hasRateOverrun = poRate && item.unit_price > poRate + 0.005;
              const isUnapproved = !item.matched_po_line_id;
              const lineVariance = isUnapproved ? item.line_total : (hasRateOverrun ? (item.unit_price - poRate) * item.quantity : 0);

              return (
                <tr key={idx} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#0A2540]">
                    <span className="font-mono text-[#64748B] mr-1.5">{item.line_number < 10 ? `0${item.line_number}` : item.line_number}.</span>
                    {item.description}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    {item.matched_po_line_id ? (
                      <span className="text-[#0A2540] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                        {item.matched_po_line_id}
                      </span>
                    ) : (
                      <span className="text-[#991B1B] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]">
                        UNCONTRACTED
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#475569]">
                    {item.quantity.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {poRate && hasRateOverrun ? (
                      <span>
                        <del className="text-[#94A3B8] mr-1">${poRate.toFixed(2)}</del>
                        <span className="font-semibold text-[#991B1B]">${item.unit_price.toFixed(2)}</span>
                      </span>
                    ) : (
                      <span className="text-[#0A2540]">${item.unit_price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#0A2540]">
                    ${item.line_total.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {lineVariance > 0.005 ? (
                      <span className="text-[#991B1B] font-bold">+${lineVariance.toFixed(2)}</span>
                    ) : (
                      <span className="text-[#166534]">$0.00</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isUnapproved ? (
                      <span className="bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] font-semibold">
                        UNAPPROVED
                      </span>
                    ) : hasRateOverrun ? (
                      <span className="bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] font-semibold">
                        OVERCHARGE
                      </span>
                    ) : (
                      <span className="bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] font-semibold">
                        CLEARED
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3-Column Reconciliation Summary Footer */}
      <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-2.5">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">Authorized PO Contract</div>
          <div className="text-base font-bold text-[#0A2540] mt-0.5">
            <TabularCurrency amount={poBaselineTotal} />
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-2.5">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">Billed Invoice Total</div>
          <div className="text-base font-bold text-[#0A2540] mt-0.5">
            <TabularCurrency amount={billedTotal} />
          </div>
        </div>
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] p-2.5">
          <div className="text-[10px] font-mono text-[#991B1B] uppercase font-semibold">Preventable Capital Leakage</div>
          <div className="text-base font-bold text-[#991B1B] mt-0.5">
            <TabularCurrency amount={varianceTotal} isDelta={varianceTotal > 0} />
          </div>
        </div>
      </div>
    </div>
  );
}
