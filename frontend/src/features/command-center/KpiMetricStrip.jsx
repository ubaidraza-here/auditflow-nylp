import React from 'react';
import { Landmark, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import TabularCurrency from '../../components/common/TabularCurrency';

export default function KpiMetricStrip({ kpis }) {
  const {
    total_audited_volume = 17500.00,
    prevented_leakage_amount = 1650.00,
    pending_exceptions_count = 2,
    clean_match_rate_percent = 16.7
  } = kpis || {};

  const roiPercent = total_audited_volume > 0
    ? ((prevented_leakage_amount / total_audited_volume) * 100).toFixed(2)
    : '9.43';
  const formattedExceptions = String(pending_exceptions_count).padStart(2, '0');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 font-sans">
      {/* 01. Audited Gross Volume */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] border-t-2 border-t-[#0A2540] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B] text-xs font-mono mb-2">
          <span className="font-semibold tracking-wider">01. AUDITED GROSS VOLUME</span>
          <Landmark className="w-4 h-4 text-[#0A2540]" />
        </div>
        <div className="text-2xl font-bold text-[#0A2540]">
          <TabularCurrency amount={total_audited_volume} />
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
          <div>
            <div className="font-semibold text-[#0A2540]">{kpis?.total_records || 6} Active Records</div>
            <div className="text-[10px] font-mono text-[#94A3B8]">Q4 TREASURY AUDIT</div>
          </div>
          {/* Micro-sparkline SVG */}
          <svg className="w-16 h-6 overflow-visible" viewBox="0 0 60 20">
            <path
              d="M 0 16 L 12 12 L 24 14 L 36 8 L 48 10 L 60 4"
              fill="none"
              stroke="#0A2540"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="60" cy="4" r="2.5" fill="#0A2540" />
          </svg>
        </div>
      </div>

      {/* 02. Prevented Leakage */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] border-t-2 border-t-[#059669] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B] text-xs font-mono mb-2">
          <span className="font-semibold tracking-wider">02. PREVENTED LEAKAGE</span>
          <span className="bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] font-semibold">
            +{roiPercent}% ROI
          </span>
        </div>
        <div className="text-2xl font-bold text-[#059669]">
          <TabularCurrency amount={prevented_leakage_amount || 6420.50} className="text-[#059669]" />
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
          <div>
            <div className="font-semibold text-[#059669]">Hard Disbursement Blocks</div>
            <div className="text-[10px] text-[#64748B]">Unit Overcharges &amp; Fees</div>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#059669] flex-shrink-0" />
        </div>
      </div>

      {/* 03. Forensic Exceptions */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] border-t-2 border-t-[#D97706] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B] text-xs font-mono mb-2">
          <span className="font-semibold tracking-wider">03. FORENSIC EXCEPTIONS</span>
          <AlertTriangle className="w-4 h-4 text-[#D97706]" />
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold font-sans tabular-nums text-[#0A2540]">
            {formattedExceptions}
          </span>
          <span className="bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] font-semibold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
            Requires Sign-Off
          </span>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
          <div>
            <div className="font-semibold text-[#991B1B]">{pending_exceptions_count} Flagged Violations</div>
            <div className="text-[10px] text-[#64748B]">Payment Suspension Active</div>
          </div>
          {/* Segmented Severity Bar */}
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-3.5 bg-[#DC2626] rounded-xs" title="Critical Overcharge" />
            <span className="w-2.5 h-3.5 bg-[#D97706] rounded-xs" title="High Unapproved Line" />
            <span className="w-2.5 h-3.5 bg-[#F59E0B] rounded-xs opacity-60" title="Duplicate Candidate" />
          </div>
        </div>
      </div>

      {/* 04. Zero-Touch Match Rate */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] border-t-2 border-t-[#0A2540] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B] text-xs font-mono mb-2">
          <span className="font-semibold tracking-wider">04. ZERO-TOUCH MATCH RATE</span>
          <span className="font-mono text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
            Target: 85%
          </span>
        </div>
        <div className="text-2xl font-bold text-[#0A2540] font-sans tabular-nums">
          {clean_match_rate_percent.toFixed(1)}%
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
          <div>
            <div className="font-semibold text-[#0A2540]">P95 Latency: 420ms</div>
            <div className="text-[10px] text-[#64748B]">3-Way Automated Match</div>
          </div>
          <div className="w-16 bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
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
