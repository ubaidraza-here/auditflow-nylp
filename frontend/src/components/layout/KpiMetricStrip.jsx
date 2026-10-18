import React from 'react';

export default function KpiMetricStrip({ kpis, invoices = [], totalInvoicesCount }) {
  const list = invoices || [];
  const computedVolume = list.reduce((acc, inv) => acc + (Number(inv.grand_total || inv.billed_amount) || 0), 0);
  const totalVolume = list.length > 0 ? computedVolume : (kpis?.total_audited_volume || 0);

  const isFlagged = (inv) => ['EXCEPTION_FLAGGED', 'NEEDS_REVIEW', 'FLAGGED'].includes(inv.status);
  const flaggedInvoices = list.filter(isFlagged);
  const exceptionsCount = list.length > 0 ? flaggedInvoices.length : (kpis?.pending_exceptions_count ?? 0);

  const computedLeakage = list.reduce((acc, inv) => {
    const status = String(inv.status || inv.new_status || '').toUpperCase();
    if (['APPROVED_WITH_OVERRIDE', 'APPROVED_OVERRIDE', 'OVERRIDE'].includes(status)) return acc;
    const isTarget = ['EXCEPTION_FLAGGED', 'NEEDS_REVIEW', 'FLAGGED', 'REJECTED_DISPUTED', 'DISPUTED', 'REJECTED', 'REJECT', 'DISPUTE MEMO FILED'].some(k => status.includes(k)) || Boolean(inv.flag_reason) || Boolean(inv.discrepancies?.length > 0);
    if (!isTarget) return acc;
    const invNum = String(inv.invoice_number || '').toUpperCase();
    const flagR = String(inv.flag_reason || '').toUpperCase();
    const discs = inv.discrepancies || [];
    const isDup = invNum.includes('-REV') || flagR.includes('DUPLICATE') || discs.some(d => String(d.rule_code || '').toUpperCase().includes('DUPLICATE'));
    if (isDup) {
      const total = Number(inv.grand_total || inv.billed_amount || 0);
      const dSum = discs.reduce((s, d) => s + (Number(d.financial_impact || d.variance_amount) || 0), 0);
      return acc + Math.max(total, dSum, Number(inv.total_variance_amount || inv.variance_amount || 0));
    }
    const dSum = discs.reduce((s, d) => s + (Number(d.financial_impact || d.variance_amount) || 0), 0);
    const varVal = Math.abs(Number(inv.total_variance_amount ?? inv.variance_amount ?? 0));
    return acc + (Math.max(dSum, varVal) || Math.max(0, Number(inv.grand_total || 0) - Number(inv.matched_purchase_order?.authorized_total || inv.po_baseline_grand_total || inv.grand_total || 0)));
  }, 0);

  const preventedLeakage = list.length > 0 ? computedLeakage : (kpis?.prevented_leakage_amount || 0);
  const roiPercent = totalVolume > 0 ? (preventedLeakage / totalVolume) * 100 : 0;
  const isClean = (inv) => ['MATCHED_APPROVED', 'AUTO_APPROVED', 'APPROVED', 'VERIFIED_MATCH', 'APPROVED_CLEAN', 'Approved Clean'].includes(inv.status) && (inv.discrepancies?.length || 0) === 0 && Math.abs(Number(inv.total_variance_amount || inv.variance_amount || 0)) === 0;
  const cleanCount = list.filter(isClean).length;
  const matchRate = list.length > 0 ? (cleanCount / list.length) * 100 : (kpis?.clean_match_rate_percent || 0);
  const activeCount = list.length > 0 ? list.length : (totalInvoicesCount || 0);

  const volume = totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [volMain, volDec] = volume.split('.');
  const leakage = preventedLeakage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [leakMain, leakDec] = leakage.split('.');
  const excCount = String(exceptionsCount).padStart(2, '0');
  const matchRateStr = matchRate.toFixed(1);

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Audited Gross Volume */}
        <div className="bg-white border border-[#E2E8F0] border-t-2 border-t-[#0A2540] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">01. Audited Gross Volume</span>
              <span className="material-symbols-outlined text-[#94A3B8] text-[18px]">account_balance</span>
            </div>
            <div className="flex items-baseline mt-1 font-sans tabular-nums text-[32px] font-semibold tracking-tight text-[#0A2540]">
              <span>${volMain}</span>
              <span className="text-[20px] font-medium opacity-65">.{volDec}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between font-sans text-xs">
            <div className="flex flex-col">
              <span className="text-[#475569]">{activeCount} Active Records</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Q4 Treasury Audit</span>
            </div>
            <div className="w-16 h-5">
              <svg className="w-full h-full text-[#0A2540]" fill="none" preserveAspectRatio="none" viewBox="0 0 80 24">
                <path d="M0 18 L12 16 L25 19 L40 11 L52 14 L65 5 L80 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                <circle cx="80" cy="9" fill="currentColor" r="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Prevented Capital Leakage */}
        <div className="bg-white border border-[#E2E8F0] border-t-2 border-t-[#059669] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">02. Prevented Leakage</span>
              <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans tabular-nums font-semibold tracking-tight inline-flex items-center gap-1.5 border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span>+{roiPercent.toFixed(2)}% ROI</span>
              </span>
            </div>
            <div className="flex items-baseline mt-1 font-sans tabular-nums text-[32px] font-semibold tracking-tight text-[#065F46]">
              <span>${leakMain}</span>
              <span className="text-[20px] font-medium opacity-65">.{leakDec}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between font-sans text-xs">
            <div className="flex flex-col">
              <span className="text-[#475569]">Hard Disbursement Blocks</span>
              <span className="text-[10px] text-[#059669] font-medium">Unit Overcharges &amp; Fees</span>
            </div>
            <span className="material-symbols-outlined text-[#059669] text-[20px]">verified_user</span>
          </div>
        </div>

        {/* Card 3: Forensic Exceptions */}
        <div className={`bg-white border border-[#E2E8F0] border-t-2 ${exceptionsCount === 0 ? 'border-t-[#059669]' : 'border-t-[#D97706]'} rounded-lg p-5 shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">03. Forensic Exceptions</span>
              <span className={`w-2 h-2 rounded-full ${exceptionsCount === 0 ? 'bg-[#059669]' : 'bg-[#D97706] animate-pulse'}`} />
            </div>
            <div className="flex items-baseline gap-2 mt-1 font-sans tabular-nums">
              <span className="text-[32px] font-semibold tracking-tight text-[#0A2540]">{excCount}</span>
              {exceptionsCount === 0 ? (
                <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
                  <span className="text-[#16A34A] font-bold">✓</span>
                  <span>Queue Clear</span>
                </span>
              ) : (
                <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                  <span>Requires Sign-Off</span>
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between font-sans text-xs">
            <div className="flex flex-col">
              <span className="text-[#475569]">{exceptionsCount === 0 ? 'All Exceptions Resolved' : `${exceptionsCount} Flagged Violations`}</span>
              <span className={`text-[10px] ${exceptionsCount === 0 ? 'text-[#059669]' : 'text-[#92400E]'} font-medium`}>
                {exceptionsCount === 0 ? 'Disbursal Queue Ready' : 'Payment Suspension Active'}
              </span>
            </div>
            <div className="w-16 bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
              <div className={`${exceptionsCount === 0 ? 'bg-[#059669] w-full' : 'bg-[#D97706] w-2/3'} h-full`} />
            </div>
          </div>
        </div>

        {/* Card 4: Zero-Touch Match Rate */}
        <div className="bg-white border border-[#E2E8F0] border-t-2 border-t-[#0A2540] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">04. Zero-Touch Match Rate</span>
              <span className="font-sans text-[11px] text-slate-400">Target: 85%</span>
            </div>
            <div className="flex items-baseline mt-1 font-sans tabular-nums text-[32px] font-semibold tracking-tight text-[#0A2540]">
              <span>{matchRateStr}</span>
              <span className="text-[20px] font-medium opacity-65">%</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between font-sans text-xs">
            <div className="flex flex-col">
              <span className="text-[#475569]">P95 Latency: 420ms</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">3-Way Automated Match</span>
            </div>
            <div className="w-16 bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0A2540] h-full" style={{ width: `${Math.min(100, Number(matchRateStr))}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
