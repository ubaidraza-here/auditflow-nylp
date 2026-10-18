import React from 'react';

export default function DisputeMemorandumView({
  invoice,
  formatUsd,
  attachProof,
  setAttachProof,
  ccLeadership,
  setCcLeadership,
}) {
  const ext = invoice.extracted_data || {};
  const discrepancies = invoice.discrepancies || [];
  const varianceTotal =
    discrepancies.reduce((s, d) => s + (d.financial_impact || 0), 0) || 450.0;
  const poAmount = invoice.matched_purchase_order?.authorized_total || 2500.0;
  const billedAmount = invoice.grand_total || 2950.0;

  return (
    <div className="p-5 md:p-6 flex flex-col gap-5 overflow-y-auto max-h-[calc(85vh-130px)]">
      {/* 1. Official Institutional Letterhead Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/60 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0A2540] text-[#FFFFFF] flex items-center justify-center font-mono font-bold text-sm tracking-wider shadow-sm">
            AF
          </div>
          <div>
            <div className="font-label-code text-[11px] font-bold tracking-widest text-primary uppercase">
              AUDITFLOW FINANCIAL GOVERNANCE // COMPLIANCE DIVISION
            </div>
            <div className="font-headline-sm text-[16px] text-primary font-medium">
              Formal Notice of Invoice Discrepancy &amp; Disbursement Suspension
            </div>
          </div>
        </div>

        <div className="text-right font-label-code text-[10px] text-on-surface-variant flex flex-col items-start sm:items-end">
          <span className="font-semibold text-primary">REF: {invoice.invoice_number} // {invoice.po_reference}</span>
          <span>DATE: {invoice.invoice_date || '2026-10-14'} • JURISDICTION: EU-CH</span>
        </div>
      </div>

      {/* 2. Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-label-code">
        <div className="p-3 bg-surface-container-low rounded border border-outline-variant/50">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-0.5">VENDOR AP RECIPIENT</span>
          <div className="font-body-md font-bold text-primary truncate">{invoice.vendor_name}</div>
          <span className="text-[11px] text-on-surface-variant truncate block">{ext.vendor_email || 'billing@apextech.com'}</span>
        </div>

        <div className="p-3 bg-surface-container-low rounded border border-outline-variant/50">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-0.5">CONTRACTED REQUISITION</span>
          <div className="font-numeric-md font-bold text-primary">{formatUsd(poAmount)} PO Cap</div>
          <span className="text-[11px] text-on-surface-variant block">Billed: {formatUsd(billedAmount)}</span>
        </div>

        <div className="p-3 bg-[#FDF0ED] rounded border border-[#F4B8AE]">
          <span className="text-[10px] uppercase font-bold text-secondary block mb-0.5">DISPUTED VARIANCE DELTA</span>
          <div className="font-numeric-md font-bold text-secondary text-base">+{formatUsd(varianceTotal)}</div>
          <span className="text-[10px] font-semibold text-secondary block uppercase">Net 30 Clock Suspended</span>
        </div>
      </div>

      {/* 3. Itemized Discrepancy Audit Dossier */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between font-label-code text-[11px]">
          <span className="font-bold uppercase tracking-wider text-primary">AUDITED CONTRACTUAL VIOLATIONS ({discrepancies.length})</span>
          <span className="text-on-surface-variant text-[10px]">DETERMINISTIC 3-WAY MATCH FAILURE</span>
        </div>

        <div className="space-y-2">
          {discrepancies.map((d, i) => (
            <div
              key={d.flag_id || i}
              className="p-3.5 bg-surface-container-lowest rounded border border-outline-variant/60 border-l-4 border-l-secondary flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-label-code text-[10px] font-bold px-1.5 py-0.2 rounded bg-secondary-fixed text-secondary uppercase">
                    VIOLATION 0{i + 1} // {d.rule_code || 'RULE_05'}
                  </span>
                  <span className="font-body-sm font-semibold text-primary text-xs">{d.title}</span>
                </div>
                <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">{d.explanation}</p>
              </div>

              {d.financial_impact !== undefined && (
                <div className="shrink-0 font-numeric-sm font-bold text-secondary text-right sm:self-center">
                  +{formatUsd(d.financial_impact)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Official Required Remediation Clause */}
      <div className="p-3.5 bg-[#FAF9F5] border border-outline-variant/60 rounded flex items-start gap-3">
        <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">gavel</span>
        <div className="font-body-sm text-xs text-primary leading-relaxed">
          <strong className="font-label-code uppercase text-[11px] block text-primary mb-0.5">Mandatory Remediation Protocol:</strong>
          Vendor must issue a corrected invoice matching authorized baseline total of <strong>{formatUsd(poAmount)}</strong>, or dispatch Credit Memorandum for <strong>{formatUsd(varianceTotal)}</strong> within 5 business days to release payment disbursement.
        </div>
      </div>

      {/* 5. Cryptographic & Audit Trail Dispatch Controls */}
      <div className="pt-2 border-t border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-label-code text-[11px] text-on-surface-variant">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={attachProof} onChange={(e) => setAttachProof(e.target.checked)} className="accent-primary cursor-pointer" />
            <span className="text-primary font-medium">Attach cryptographically signed PDF forensic proof sheet (SHA-256 verified)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ccLeadership} onChange={(e) => setCcLeadership(e.target.checked)} className="accent-primary cursor-pointer" />
            <span className="text-primary font-medium">CC Lead AP Controller &amp; Chief Procurement Officer (log #log_5004)</span>
          </label>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-semibold self-start sm:self-center">
          <span className="material-symbols-outlined text-[14px] text-tertiary-container">verified</span>
          <span>TLS 1.3 / S-MIME COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}
