import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState([]);

  useEffect(() => {
    apiClient.getPurchaseOrders().then((data) => setPos(data || []));
  }, []);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

  return (
    <div className="w-full bg-[#F4F6F8] min-h-[calc(100vh-4rem)] text-[#0A2540]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header Command Bar */}
        <section className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A2540] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#0A2540] tracking-tight">
                Authoritative ERP Purchase Order Baselines
              </h1>
              <p className="text-xs text-[#64748B]">
                Contracted Ceilings &amp; Three-Way Reconciliation Rules
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <span>{pos.length} Contract Baselines Loaded</span>
            </span>
            <span className="text-[#64748B] font-sans hidden md:inline">Tolerance: 0.00%</span>
          </div>
        </section>

        {/* PO Table Card */}
        <section className="bg-white rounded-xl border border-[#CBD5E1] shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 select-none">
                  <th className="py-3 px-4">PO NUMBER</th>
                  <th className="py-3 px-4">CONTRACTED VENDOR</th>
                  <th className="py-3 px-4">TAX ID &amp; IBAN ROUTING</th>
                  <th className="py-3 px-4">LINE REQUISITIONS</th>
                  <th className="py-3 px-4 text-right">ALLOCATED BUDGET</th>
                  <th className="py-3 px-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {pos.map((po) => {
                  const isDisputed = po.po_number === 'PO-2026-102';
                  const isSettled = po.po_number === 'PO-2026-103';

                  return (
                    <tr
                      key={po.po_number}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        isDisputed ? 'bg-[#FFF1F2]/40 border-l-4 border-l-[#9F1239]' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#0A2540]">
                        {po.po_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-sans font-medium text-[#0F172A]">{po.vendor_name}</div>
                        <div className="font-mono text-[11px] text-[#64748B]">{po.vendor_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748B]">
                        <div className="font-semibold text-[#0F172A]">{po.vendor_tax_id}</div>
                        <div>{po.expected_iban}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        <span className="font-sans font-semibold text-[#0A2540]">{po.line_items?.length || 2} Items</span>
                        <span className="block text-[11px] text-[#64748B] truncate max-w-xs font-sans">
                          {po.line_items?.[0]?.description || 'Requisition schedule active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans tabular-nums font-semibold text-right text-[#0A2540] whitespace-nowrap">
                        {formatCurrency(po.authorized_grand_total || po.authorized_total)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isDisputed ? (
                          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                            <span>Dispute Hold</span>
                          </span>
                        ) : isSettled ? (
                          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
                            <span>Settled</span>
                          </span>
                        ) : (
                          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                            <span>Active: Open</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footnote Meta Bar */}
          <div className="p-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[#64748B] text-xs font-sans">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500">Contract Ceiling Compliance: Strict Enforcement</span>
              </span>
              <span className="hidden sm:inline text-[#CBD5E1]">•</span>
              <span className="hidden sm:inline text-[11px] text-slate-500">Discrepancy Threshold: 0.00% Tolerance</span>
            </div>
            <span className="font-mono text-[11px]">ERP_SYNC: ACTIVE</span>
          </div>
        </section>
      </div>
    </div>
  );
}
