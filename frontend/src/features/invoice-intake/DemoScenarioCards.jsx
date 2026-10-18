import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

const PRESETS = [
  {
    id: 'SCENARIO_A_CLEAN',
    code: 'Scenario A: Clean 3-Way Match',
    vendor: 'CloudHost Enterprise PK',
    amount: '$950.00',
    po: 'PO-2026-101',
    status: 'Clean Match',
    statusClass: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    dotClass: 'bg-[#16A34A]',
    targetInvoiceId: 'inv_1001',
  },
  {
    id: 'SCENARIO_B_OVERCHARGE',
    code: 'Scenario B: Price Overrun & Fee',
    vendor: 'Apex Tech Solutions',
    amount: '$2,950.00',
    po: 'PO-2026-102 (+$450 Over)',
    status: 'Variance Intercept',
    statusClass: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    dotClass: 'bg-[#DC2626]',
    targetInvoiceId: 'inv_1002',
  },
  {
    id: 'SCENARIO_C_DUPLICATE',
    code: 'Scenario C: Exact Hash Duplicate',
    vendor: 'Prime Office Logistica',
    amount: '$1,200.00',
    po: 'PO-2026-103 (Duplicated)',
    status: 'Duplicate Block',
    statusClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    dotClass: 'bg-[#D97706]',
    targetInvoiceId: 'inv_1003',
  },
];

export default function DemoScenarioCards({ onReset, onScenarioTriggered }) {
  const [loadingId, setLoadingId] = useState(null);
  const navigate = useNavigate();

  const handleScenario = async (preset) => {
    try {
      setLoadingId(preset.id);
      const res = await apiClient.triggerDemoScenario(preset.id);
      if (onScenarioTriggered) {
        onScenarioTriggered(res?.invoice);
      }
      const invoiceId = res?.invoice?.invoice_id || preset.targetInvoiceId;
      navigate(`/workbench/${invoiceId}`);
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
      navigate(`/workbench/${preset.targetInvoiceId}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="w-full bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#F1F5F9] gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0A2540] text-[18px]">tune</span>
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Interactive Benchmark Scenarios — Live Audit Simulation
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span>Live Event Feed Active</span>
          </span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-[#64748B] hover:text-[#0A2540] text-xs font-sans underline cursor-pointer transition-colors"
            >
              Reset View
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESETS.map((preset) => {
          const isLoading = loadingId === preset.id;
          return (
            <div
              key={preset.id}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#CBD5E1] transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-sans text-xs font-semibold text-[#0A2540]">
                    {preset.code}
                  </span>
                  <span className={`rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border ${preset.statusClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${preset.dotClass}`} />
                    <span>{preset.status}</span>
                  </span>
                </div>
                <div className="font-sans text-xs text-[#475569] mb-0.5 font-medium">
                  {preset.vendor}
                </div>
                <div className="font-sans text-[11px] text-[#64748B]">
                  Billed: <strong className="font-sans tabular-nums font-semibold tracking-tight text-[#0A2540]">{preset.amount}</strong> • Baseline: <span className="font-mono text-[11px]">{preset.po}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleScenario(preset)}
                disabled={isLoading}
                className="mt-3 w-full py-1.5 px-3 bg-white hover:bg-[#0A2540] hover:text-white border border-[#CBD5E1] text-[#0A2540] rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Injecting Pipeline...' : 'Run Scenario'}</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
