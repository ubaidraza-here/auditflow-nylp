import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Eye, ShieldCheck, Check } from 'lucide-react';
import TabularCurrency from '../../components/common/TabularCurrency';

export default function DocumentEvidencePane({ invoice }) {
  const [zoom, setZoom] = useState(1);
  const [showOverlays, setShowOverlays] = useState(true);

  const isDisputed = invoice?.status === 'REJECTED_DISPUTED';
  const isApproved = invoice?.status === 'APPROVED_CLEAN';
  const isOverride = invoice?.status === 'APPROVED_WITH_OVERRIDE';

  return (
    <div className="bg-[#EDF1F5] border border-[#E2E8F0] rounded-[6px] shadow-xs flex flex-col h-full overflow-hidden">
      {/* Evidence Toolbar */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(z => Math.max(0.85, z - 0.1))}
            className="p-1 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-[#0A2540] font-semibold w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(1.25, z + 0.1))}
            className="p-1 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] ml-1"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-2 py-1 rounded-[4px] border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
              showOverlays
                ? 'bg-[#0A2540] text-white border-[#0A2540]'
                : 'bg-white text-[#64748B] border-[#E2E8F0]'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Overlays: {showOverlays ? 'ACTIVE' : 'OFF'}</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-[4px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span>98.4% Confidence (Gemini 2.5)</span>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="p-6 flex-1 overflow-auto flex items-center justify-center relative min-h-[560px]">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="w-full max-w-[490px] bg-white border border-[#CBD5E1] p-6 shadow-md rounded-[2px] relative text-[#0A2540] transition-transform"
        >
          {/* Angled Verification Stamp */}
          {isDisputed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="border-4 border-[#991B1B] text-[#991B1B] font-mono font-black text-xl px-6 py-2 rounded-lg -rotate-12 uppercase tracking-widest bg-white/90 shadow-lg">
                [DISPUTED // PAYMENT ON HOLD]
              </div>
            </div>
          )}
          {isApproved && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="border-4 border-[#166534] text-[#166534] font-mono font-black text-xl px-6 py-2 rounded-lg -rotate-12 uppercase tracking-widest bg-white/90 shadow-lg">
                [APPROVED • VERIFIED MATCH]
              </div>
            </div>
          )}
          {isOverride && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="border-4 border-[#334155] text-[#334155] font-mono font-black text-xl px-6 py-2 rounded-lg -rotate-12 uppercase tracking-widest bg-white/90 shadow-lg">
                [AUDIT OVERRIDE • AUTHORIZED]
              </div>
            </div>
          )}

          {/* Invoice Header */}
          <div className="border-b border-[#E2E8F0] pb-4 mb-4 flex justify-between items-start">
            <div>
              <div className="font-bold text-base tracking-tight text-[#0A2540]">
                {invoice?.vendor_name || 'Apex Tech Solutions'}
              </div>
              <div className="font-mono text-[10px] text-[#64748B]">
                Tax NTN: {invoice?.vendor_ntn || 'NTN-8839201-4'}
              </div>
              <div className="font-mono text-[10px] text-[#64748B]">
                Billing: {invoice?.vendor_email || 'billing@apextech.com'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-xs text-[#0A2540]">COMMERCIAL TAX INVOICE</div>
              <div className="font-mono text-[11px] text-[#991B1B] font-bold">#{invoice?.invoice_number}</div>
              <div className="font-mono text-[10px] text-[#64748B]">Date: {invoice?.invoice_date}</div>
              <div className="font-mono text-[10px] text-[#0A2540] font-semibold">PO: {invoice?.po_reference}</div>
            </div>
          </div>

          {/* Visual Invoice Table with Optical Discrepancy Callouts */}
          <div className="border border-[#E2E8F0] rounded-[2px] overflow-hidden mb-4 text-[11px]">
            <div className="grid grid-cols-6 bg-[#F8FAFC] border-b border-[#E2E8F0] p-1.5 font-mono text-[10px] text-[#64748B] font-semibold">
              <span className="col-span-3">Item Description</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Total</span>
            </div>

            {/* Line 1 Callout */}
            <div className={`p-2 border-b border-[#F1F5F9] relative ${
              showOverlays && invoice?.total_variance_amount > 0 ? 'bg-[#FEF2F2] ring-1 ring-[#FECACA]' : ''
            }`}>
              <div className="grid grid-cols-6 items-center">
                <span className="col-span-3 font-medium text-[#0A2540]">27-inch IPS Monitor Panel</span>
                <span className="text-center font-mono">10.0</span>
                <span className="text-right font-mono font-bold text-[#991B1B]">$250.00</span>
                <span className="text-right font-mono">$2,500.00</span>
              </div>
              {showOverlays && invoice?.total_variance_amount > 0 && (
                <div className="mt-1 font-mono text-[9px] text-[#991B1B] font-semibold flex items-center justify-between">
                  <span>↳ OPTICAL VARIANCE: +$40.00/unit over PO baseline rate</span>
                  <span>+$400.00 Overcharge</span>
                </div>
              )}
            </div>

            {/* Line 2 */}
            <div className="p-2 border-b border-[#F1F5F9] grid grid-cols-6 items-center">
              <span className="col-span-3 font-medium text-[#0A2540]">USB-C Docking Station</span>
              <span className="text-center font-mono">5.0</span>
              <span className="text-right font-mono">$80.00</span>
              <span className="text-right font-mono">$400.00</span>
            </div>

            {/* Line 3 Unapproved Callout */}
            <div className={`p-2 relative ${
              showOverlays && invoice?.total_variance_amount > 0 ? 'bg-[#FFFBEB] ring-1 ring-[#FDE68A]' : ''
            }`}>
              <div className="grid grid-cols-6 items-center">
                <span className="col-span-3 font-medium text-[#0A2540]">Rush Delivery &amp; Handling Fee</span>
                <span className="text-center font-mono">1.0</span>
                <span className="text-right font-mono font-bold text-[#92400E]">$50.00</span>
                <span className="text-right font-mono">$50.00</span>
              </div>
              {showOverlays && invoice?.total_variance_amount > 0 && (
                <div className="mt-1 font-mono text-[9px] text-[#92400E] font-semibold flex items-center justify-between">
                  <span>↳ UNCONTRACTED SURCHARGE: Absent from PO-2026-102</span>
                  <span>+$50.00 Unauthorized</span>
                </div>
              )}
            </div>
          </div>

          {/* Totals Block */}
          <div className="flex justify-end mb-4">
            <div className="w-48 text-[11px] space-y-1 font-mono">
              <div className="flex justify-between text-[#64748B]">
                <span>Subtotal:</span>
                <span>${(invoice?.grand_total || 2950).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs text-[#0A2540] pt-1 border-t border-[#E2E8F0]">
                <span>Grand Total:</span>
                <span>${(invoice?.grand_total || 2950).toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Strip */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px] p-2 text-[9px] font-mono text-[#64748B] space-y-0.5">
            <div className="truncate">
              <strong>SHA-256:</strong> {invoice?.sha256_hash || 'a4f89d31...'}
            </div>
            <div className="flex justify-between">
              <span><strong>NTN:</strong> {invoice?.vendor_ntn}</span>
              <span><strong>IBAN:</strong> {invoice?.bank_account_or_iban}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
