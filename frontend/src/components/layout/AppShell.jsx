import React from 'react';
import { Search, Plus, ShieldCheck, Database, Layers } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Triage Ledger', step: '01' },
  { id: 'workbench', label: 'Forensic Workbench', step: '02' },
  { id: 'upload', label: 'Invoice Intake', step: '03' },
  { id: 'pos', label: 'PO Registry', step: '04' },
  { id: 'audit-logs', label: 'Audit Trail', step: '05' }
];

export default function AppShell({ activeTab, onNavigate, onOpenQuickAudit, children }) {
  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#0A2540] flex flex-col font-sans selection:bg-[#E2E8F0]">
      {/* Top Executive Header Bar */}
      <header className="bg-white border-b border-[#E2E8F0] h-16 px-6 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        {/* Left Emblem & Wordmark */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0A2540] text-white font-bold rounded-[4px] w-8 h-8 flex items-center justify-center text-xs tracking-wider shadow-xs font-mono">
            AF
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#0A2540] tracking-tight">AuditFlow</span>
            <span className="bg-[#F1F5F9] text-[#475569] text-[11px] font-mono px-1.5 py-0.5 rounded-[4px] border border-[#E2E8F0] font-medium leading-none">
              v1.0-PROD
            </span>
          </div>
        </div>

        {/* Center Segmented Navigation Control */}
        <nav className="hidden md:flex items-center bg-[#F1F5F9] p-1 rounded-[6px] border border-[#E2E8F0] gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-[4px] transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0A2540] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0A2540] hover:bg-white/60'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{item.step}.</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Audit ⌘K */}
          <button
            onClick={onOpenQuickAudit}
            className="border border-[#E2E8F0] bg-white text-[#475569] text-xs px-2.5 py-1.5 rounded-[4px] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="hidden sm:inline">Quick Audit</span>
            <kbd className="font-mono text-[10px] text-[#64748B] bg-[#F1F5F9] px-1 py-0.5 rounded border border-[#E2E8F0]">
              ⌘K
            </kbd>
          </button>

          {/* Gemini 2.5 Vision Ready Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-xs font-medium px-2.5 py-1.5 rounded-[4px] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse flex-shrink-0" />
            <span className="font-mono text-[11px] font-semibold">Gemini 2.5 Vision Ready</span>
          </div>

          {/* Primary Upload CTA */}
          <button
            onClick={() => onNavigate('upload')}
            className="bg-[#0A2540] hover:bg-[#1E3A5F] text-white text-xs font-semibold px-3.5 py-2 rounded-[4px] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Invoice</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 pb-12">{children}</main>

      {/* Institutional Enterprise Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4 px-6 text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0A2540]" />
          <span className="font-medium text-[#0A2540]">AuditFlow Financial Forensics Ledger</span>
          <span className="text-[#94A3B8]">•</span>
          <span>NYLP AI Hackathon 2026 (Oct 17–19, 2026)</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-mono text-[#475569]">SHA-256 Cryptographic Verification</span>
          <span className="text-[#94A3B8]">•</span>
          <span>Lead Architects: <strong className="text-[#0A2540]">Ubaid Raza</strong> & <strong className="text-[#0A2540]">Anushka Samad</strong></span>
        </div>
      </footer>
    </div>
  );
}
