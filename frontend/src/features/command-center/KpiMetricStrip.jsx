import React from 'react';
import { DollarSign, ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import TabularCurrency from '../../components/common/TabularCurrency';

export default function KpiMetricStrip({ kpis }) {
  const {
    total_audited_volume = 142850.00,
    prevented_leakage_amount = 4320.50,
    pending_exceptions_count = 2,
    clean_match_rate_percent = 75.0
  } = kpis || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 01. Audited Gross Volume */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B] text-xs font-mono mb-2">
          <span>01. AUDITED GROSS VOLUME</span>
          <DollarSign className="w-4 h-4 text-[#0A2540]" />
        </div>
        <div className="text-2xl font-bold text-[#0A2540]">
          <TabularCurrency amount={total_audited_volume} />
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-[#64748B]">
          <span className="text-[#166534] font-medium flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +12.4%
          </span>
          <span>vs last billing cycle</span>
        </div>
      </div>

      {/* 02. Prevented Capital Leakage */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B] text-xs font-mono mb-2">
          <span>02. PREVENTED LEAKAGE</span>
          <span className="bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] font-semibold">
            +3.02% ROI
          </span>
        </div>
        <div className="text-2xl font-bold text-[#0A2540]">
          <TabularCurrency amount={prevented_leakage_amount} />
        </div>
        <div className="flex items-center justify-between mt-2.5 text-[11px] text-[#64748B]">
          <span className="text-[#991B1B] font-medium">+$450.00 intercepted today</span>
          <span className="font-mono text-[10px]">7 Rules Active</span>
        </div>
      </div>

      {/* 03. Forensic Exceptions */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B] text-xs font-mono mb-2">
          <span>03. FORENSIC EXCEPTIONS</span>
          <AlertTriangle className="w-4 h-4 text-[#D97706]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-sans tabular-nums text-[#0A2540]">
            {pending_exceptions_count}
          </span>
          <span className="text-xs text-[#64748B]">active cases</span>
        </div>
        <div className="flex items-center gap-2 mt-2.5 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
          <span className="text-[#991B1B] font-medium">Requires controller review</span>
        </div>
      </div>

      {/* 04. Zero-Touch Match Rate */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B] text-xs font-mono mb-2">
          <span>04. ZERO-TOUCH MATCH RATE</span>
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-sans tabular-nums text-[#0A2540]">
            {clean_match_rate_percent.toFixed(1)}%
          </span>
          <span className="text-xs text-[#64748B]">clean 3-way pass</span>
        </div>
        <div className="mt-2.5">
          <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#0A2540] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(clean_match_rate_percent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
