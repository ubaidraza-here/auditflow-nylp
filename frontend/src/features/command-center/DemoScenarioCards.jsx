import React from 'react';
import { Play, Sparkles, Check, AlertCircle, Copy } from 'lucide-react';
import TabularCurrency from '../../components/common/TabularCurrency';

const SCENARIOS = [
  {
    id: 'SCENARIO_A_CLEAN',
    invoiceId: 'inv_1001',
    badge: 'BENCHMARK A',
    title: 'Clean 3-Way Reconciliation',
    vendor: 'CloudHost Enterprise PK',
    po: 'PO-2026-101',
    amount: 950.00,
    variance: 0.00,
    varianceType: 'clean',
    desc: 'Line items, rates, and tax match PO contract with zero tolerance deviation.',
    rules: 'Pass: 7 of 7 Rules'
  },
  {
    id: 'SCENARIO_B_OVERCHARGE',
    invoiceId: 'inv_1002',
    badge: 'BENCHMARK B',
    title: 'Unit Price Overrun & Surcharge',
    vendor: 'Apex Tech Solutions',
    po: 'PO-2026-102',
    amount: 2950.00,
    variance: 450.00,
    varianceType: 'overcharge',
    desc: 'Billed rate $250 vs $210 PO (+19.05%) plus uncontracted $50 rush surcharge.',
    rules: 'Flagged: 2 Critical Violations'
  },
  {
    id: 'SCENARIO_C_DUPLICATE',
    invoiceId: 'inv_1003',
    badge: 'BENCHMARK C',
    title: 'Fuzzy Duplicate Suffix Match',
    vendor: 'Prime Office Logistics',
    po: 'PO-2026-103',
    amount: 1200.00,
    variance: 1200.00,
    varianceType: 'duplicate',
    desc: 'Re-submission of paid INV-7710 with -REV suffix detected via ledger hash check.',
    rules: 'Flagged: Duplicate Collision'
  }
];

export default function DemoScenarioCards({ onSelectScenario, loadingScenarioId }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-5 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9] gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0A2540]" />
          <h2 className="text-xs font-mono font-bold text-[#0A2540] uppercase tracking-wider">
            1-Click Benchmark Scenarios — Live Audit Evaluation
          </h2>
        </div>
        <span className="text-[11px] text-[#64748B]">
          Instant evaluation of multi-stage neuro-symbolic pipeline
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => {
          const isLoading = loadingScenarioId === s.id;
          return (
            <div
              key={s.id}
              className="border border-[#E2E8F0] hover:border-[#0A2540] rounded-[6px] p-4 bg-[#F8FAFC] flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-[#475569] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded-[4px]">
                    {s.badge}
                  </span>
                  <span className={`font-mono text-[10px] font-semibold ${
                    s.varianceType === 'clean' ? 'text-[#166534]' : 'text-[#991B1B]'
                  }`}>
                    {s.rules}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#0A2540] mb-1 group-hover:text-[#1E3A5F]">
                  {s.title}
                </h3>
                <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
                  {s.desc}
                </p>

                <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-2.5 mb-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Vendor / PO:</span>
                    <span className="font-mono text-[#0A2540] font-medium text-[11px]">{s.po}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#64748B]">Billed Total:</span>
                    <TabularCurrency amount={s.amount} className="font-semibold text-xs" />
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-[#F1F5F9]">
                    <span className="text-[#64748B]">Variance:</span>
                    <TabularCurrency amount={s.variance} isDelta={s.variance > 0} className="font-bold text-xs" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectScenario(s.id, s.invoiceId)}
                disabled={isLoading}
                className="w-full bg-[#0A2540] hover:bg-[#1E3A5F] text-white text-xs font-semibold py-2 px-3 rounded-[4px] shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Auditing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Forensic Audit</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
