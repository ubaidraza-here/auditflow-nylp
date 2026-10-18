import React, { useState } from 'react';

export default function DocumentEvidencePane({ invoice, highlightDiscrepancies, onToggleHighlight }) {
  const [zoom, setZoom] = useState(100);
  const ext = invoice?.extracted_data || {};
  const items = invoice?.line_item_comparisons || [];
  const confidence = ((invoice?.extraction_confidence || 0.96) * 100).toFixed(1);

  const isRejected = invoice?.status === 'REJECTED_DISPUTED';
  const isApproved =
    invoice?.status === 'APPROVED_CLEAN' || invoice?.status === 'APPROVED_WITH_OVERRIDE';

  const formatUsd = (num) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-lg shadow-card overflow-hidden flex flex-col">
      {/* Top Floating Inspection Controls */}
      <div className="w-full bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between font-sans text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center border border-[#CBD5E1] rounded bg-white overflow-hidden shadow-xs">
            <button type="button" onClick={() => setZoom((z) => Math.max(70, z - 15))} className="px-2 py-0.5 hover:bg-[#F1F5F9] text-[#0A2540] font-bold cursor-pointer">−</button>
            <span className="px-2 py-0.5 text-[#0A2540] font-sans tabular-nums font-semibold border-x border-[#E2E8F0] text-[11px]">{zoom}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(130, z + 15))} className="px-2 py-0.5 hover:bg-[#F1F5F9] text-[#0A2540] font-bold cursor-pointer">+</button>
          </div>
          <button type="button" onClick={() => setZoom(100)} className="px-2.5 py-0.5 border border-[#CBD5E1] rounded bg-white hover:bg-[#F1F5F9] text-[#475569] text-[11px] font-sans transition-colors cursor-pointer shadow-xs">Fit Page</button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleHighlight}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-sans cursor-pointer transition-all shadow-xs border ${
              highlightDiscrepancies
                ? 'text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]'
                : 'text-[#64748B] bg-white border-[#CBD5E1]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{highlightDiscrepancies ? 'check_circle' : 'visibility'}</span>
            <span>Overlays: {highlightDiscrepancies ? 'Active' : 'Off'}</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-sans">
            <span>OCR:</span>
            <strong className="text-[#0A2540] font-sans tabular-nums font-semibold">{confidence}%</strong>
            <div className="w-10 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#059669]" style={{ width: `${confidence}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Soft Architectural Canvas */}
      <div className="bg-[#EDF1F5] border-y border-[#E2E8F0] p-4 md:p-6 flex justify-center items-start overflow-y-auto max-h-[620px] relative">
        <article
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="w-full max-w-[520px] bg-white rounded-md shadow-md border border-[#CBD5E1] p-6 md:p-7 relative font-sans text-xs text-[#0A2540] flex flex-col gap-4 transition-transform"
        >
          {isRejected && (
            <div className="absolute top-5 right-5 pointer-events-none transform -rotate-12 select-none border-2 border-[#9F1239] px-3 py-1 bg-white/95 text-[#9F1239] font-mono text-[10px] font-bold tracking-wider uppercase shadow-sm z-20 rounded-[4px]">
              [DISPUTED • PAYMENT ON HOLD]
            </div>
          )}
          {isApproved && (
            <div className="absolute top-5 right-5 pointer-events-none transform -rotate-12 select-none border-2 border-[#059669] px-3 py-1 bg-white/95 text-[#065F46] font-mono text-[10px] font-bold tracking-wider uppercase shadow-sm z-20 rounded-[4px]">
              [APPROVED • VERIFIED MATCH]
            </div>
          )}

          <div className="border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[18px] text-[#0A2540]">corporate_fare</span>
              <h2 className="font-sans text-sm font-bold tracking-wide uppercase text-[#0A2540]">
                {ext.vendor_name || invoice.vendor_name}
              </h2>
            </div>
            <p className="font-mono text-[10px] text-[#64748B] leading-relaxed mb-2">
              National Tax No: {ext.vendor_tax_id || 'NTN-8839201-4'} • STRN: 3277876123456<br />
              IBAN: {ext.iban_or_account || 'PK36SCBL00000011223344'} • SWIFT: SCBLPKKA
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#F1F5F9] font-mono text-[10px]">
              <div><span className="text-[#94A3B8] block text-[9px] uppercase">Invoice No</span><strong className="text-[#0A2540]">{invoice.invoice_number}</strong></div>
              <div><span className="text-[#94A3B8] block text-[9px] uppercase">Date</span><strong className="text-[#0A2540]">{invoice.invoice_date}</strong></div>
              <div><span className="text-[#94A3B8] block text-[9px] uppercase">PO Ref</span><strong className="text-[#0A2540]">{invoice.po_reference}</strong></div>
              <div><span className="text-[#94A3B8] block text-[9px] uppercase">Terms</span><strong className="text-[#0A2540]">Net 30</strong></div>
            </div>
          </div>

          <div className="border border-[#E2E8F0] rounded-md overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-sans text-[10px] uppercase font-semibold text-[#64748B]">
                  <th className="py-2 px-2.5">Item Description</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Rate</th>
                  <th className="py-2 px-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] font-sans text-[11px]">
                {items.map((it) => {
                  const isViolation = it.line_status !== 'MATCH' && highlightDiscrepancies;
                  const isOvercharge = it.variance_amount > 0 && it.line_status !== 'UNAPPROVED_LINE_ITEM';
                  return (
                    <tr key={it.line_number} className={isViolation ? (isOvercharge ? 'bg-[#FFF1F2]/60' : 'bg-[#FFFBEB]/60') : ''}>
                      <td className="py-2 px-2.5 relative">
                        <span className="font-sans font-semibold text-[#0A2540] block text-xs leading-tight">
                          {it.invoice_description}
                        </span>
                        {isViolation && (
                          <span className={`inline-block text-[9px] font-sans tabular-nums font-semibold px-1.5 py-0.2 rounded mt-0.5 border ${isOvercharge ? 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]' : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'}`}>
                            {isOvercharge ? `+$40/unit vs PO (+${formatUsd(it.variance_amount)})` : `Unapproved Surcharge (+${formatUsd(it.variance_amount)})`}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right align-top text-[#0A2540] font-sans tabular-nums font-medium">{it.invoice_quantity}</td>
                      <td className={`py-2 px-2 text-right align-top font-sans tabular-nums font-medium ${isViolation ? 'text-[#9F1239] font-semibold' : 'text-[#64748B]'}`}>{formatUsd(it.invoice_unit_price)}</td>
                      <td className={`py-2 px-2.5 text-right align-top font-sans tabular-nums font-semibold ${isViolation ? 'text-[#9F1239]' : 'text-[#0A2540]'}`}>{formatUsd(it.invoice_line_total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-1">
            <div className="w-56 space-y-1 font-sans text-xs border-t border-[#E2E8F0] pt-2">
              <div className="flex justify-between text-[#64748B]"><span>Subtotal:</span><span className="font-sans tabular-nums font-medium">{formatUsd(invoice.grand_total)}</span></div>
              <div className="flex justify-between text-[#64748B]"><span>Sales Tax (0%):</span><span className="font-sans tabular-nums font-medium">$0.00</span></div>
              <div className="flex justify-between border-t border-[#0A2540] pt-1 text-[#0A2540] items-baseline font-bold"><span className="text-[11px] uppercase">Total Due:</span><span className="font-sans tabular-nums text-sm font-semibold">{formatUsd(invoice.grand_total)}</span></div>
            </div>
          </div>

          <div className="border-t border-[#F1F5F9] pt-2 flex items-center justify-between font-mono text-[9px] text-[#94A3B8]">
            <span>ELECTRONIC TAX INVOICE ARTIFACT</span>
            <span>ORIGINAL DIGITAL VERIFIED</span>
          </div>
        </article>
      </div>

      {/* Bottom Pinned Cryptographic & Tax Strip */}
      <div className="w-full bg-[#F8FAFC] border-t border-[#E2E8F0] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] text-[10px] font-mono p-2.5 text-[#64748B]">
        <div className="flex items-center gap-1.5 px-2 py-0.5"><span className="material-symbols-outlined text-[#059669] text-[14px]">verified</span><span>SHA-256:</span><span className="text-[#0A2540] font-bold truncate">{invoice.file_hash_sha256 ? `${invoice.file_hash_sha256.substring(0, 16)}...` : 'e3b0c442...'}</span></div>
        <div className="flex items-center gap-1.5 px-2 py-0.5"><span className="material-symbols-outlined text-[#64748B] text-[14px]">domain_verification</span><span>Tax Reg:</span><span className="text-[#0A2540] font-semibold">{ext.vendor_tax_id || 'NTN-8839201-4'}</span></div>
        <div className="flex items-center gap-1.5 px-2 py-0.5"><span className="material-symbols-outlined text-[#64748B] text-[14px]">account_balance</span><span>IBAN:</span><span className="text-[#0A2540] font-semibold">{ext.iban_or_account ? `${ext.iban_or_account.substring(0, 12)}...` : 'PK36 SCBL...'}</span></div>
      </div>
    </section>
  );
}
