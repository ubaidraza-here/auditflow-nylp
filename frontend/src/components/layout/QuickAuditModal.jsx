import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, FileText, ArrowRight, Play, RotateCcw } from 'lucide-react';
import { INITIAL_INVOICES } from '../../services/mockData';
import { apiClient } from '../../services/apiClient';

export default function QuickAuditModal({ isOpen, onClose, onSelectInvoice, onSelectScenario, onReset }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredInvoices = INITIAL_INVOICES.filter((i) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      i.invoice_number.toLowerCase().includes(q) ||
      i.vendor_name.toLowerCase().includes(q) ||
      i.po_reference.toLowerCase().includes(q)
    );
  }).slice(0, 4);

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, top: 0, left: 0, right: 0, bottom: 0, margin: 0, zIndex: 9999 }}
      className="flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl bg-white rounded-lg border border-[#E2E8F0] shadow-2xl overflow-hidden font-sans">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-[#E2E8F0] bg-white">
          <Search className="w-4 h-4 text-[#64748B] mr-2" />
          <input
            autoFocus
            type="text"
            placeholder="Search invoice number, vendor, PO baseline..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-3.5 text-xs text-[#0A2540] placeholder-[#94A3B8] focus:outline-none"
          />
          <button onClick={onClose} className="text-xs text-[#64748B] hover:text-[#0A2540] p-1 rounded font-mono">
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-3">
          <div>
            <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase px-2 mb-1.5">
              Instant Benchmarks &amp; Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { onSelectScenario?.('SCENARIO_B_OVERCHARGE', 'inv_1002'); onClose(); }}
                className="text-left p-2 rounded-[4px] border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#0A2540]">Benchmark B</div>
                  <div className="text-[10px] text-[#991B1B]">+$450 Price Overrun</div>
                </div>
                <Play className="w-3.5 h-3.5 text-[#0A2540]" />
              </button>
              <button
                onClick={() => { onSelectScenario?.('SCENARIO_A_CLEAN', 'inv_1001'); onClose(); }}
                className="text-left p-2 rounded-[4px] border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#0A2540]">Benchmark A</div>
                  <div className="text-[10px] text-[#166534]">Clean 3-Way Match</div>
                </div>
                <Play className="w-3.5 h-3.5 text-[#0A2540]" />
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase px-2 mb-1.5">
              Matching Invoices
            </div>
            <div className="space-y-1">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => { onSelectInvoice(inv.id); onClose(); }}
                  className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#64748B]" />
                    <div>
                      <span className="font-mono font-semibold text-xs text-[#0A2540]">{inv.invoice_number}</span>
                      <span className="text-xs text-[#64748B] ml-2">{inv.vendor_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#0A2540] tabular-nums font-semibold">
                      ${inv.grand_total.toFixed(2)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-4 py-2 flex items-center justify-between text-[11px] text-[#64748B]">
          <span>AuditFlow Command Palette</span>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
