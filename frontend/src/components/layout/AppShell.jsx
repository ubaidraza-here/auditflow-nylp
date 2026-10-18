import React from 'react';
import { Search, Upload, ShieldCheck } from 'lucide-react';

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
      {/* Mathematically Centered 3-Column Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] min-h-16 sticky top-0 z-30 shadow-xs">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 min-h-16 py-2.5 px-4 sm:px-6">
          {/* Left Column (Brand & Emblem) */}
          <div className="justify-self-start flex items-center gap-3">
            <div className="bg-[#0A2540] text-white font-bold rounded-[4px] w-8 h-8 flex items-center justify-center text-xs tracking-wider shadow-xs font-mono">
              AF
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-bold text-[#0A2540] tracking-tight">AuditFlow</span>
                <span className="bg-[#F1F5F9] text-[#475569] text-[10px] font-mono px-1 py-0.2 rounded border border-[#E2E8F0] font-medium">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-wider text-[#64748B] mt-0.5 uppercase">
                Financial Forensics
              </span>
            </div>
          </div>

          {/* Center Column (Mathematically Centered Segmented Nav) */}
          <nav className="justify-self-center hidden md:flex items-center bg-[#F4F6F8] p-1 rounded-lg border border-[#E2E8F0] gap-1 overflow-x-auto max-w-full">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-[4px] transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#0A2540] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0A2540] hover:bg-white/70'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">{item.step}.</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Column (Controls & Badges) */}
          <div className="justify-self-end flex items-center gap-2">
            {/* Gemini 3.5 Vision Ready Status Tag */}
            <div className="hidden sm:inline-flex items-center gap-1.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-xs font-medium px-2.5 py-1.5 rounded-[4px] shadow-2xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse flex-shrink-0" />
              <span className="font-semibold">Gemini 3.5 Vision</span>
            </div>

            {/* Quick Audit (⌘K) Icon-Only Button */}
            <button
              onClick={onOpenQuickAudit}
              title="Quick Audit (⌘K)"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F8FAFC] border border-[#CBD5E1] text-[#0A2540] hover:bg-[#F1F5F9] transition-all cursor-pointer shadow-2xs"
            >
              <Search className="w-4 h-4 text-[#0A2540]" />
            </button>

            {/* Upload Tax Invoice Icon-Only Button */}
            <button
              onClick={() => onNavigate('upload')}
              title="Upload Tax Invoice"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0A2540] hover:bg-[#1E3A5F] text-white shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-white" />
            </button>
          </div>
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
          <span>NYLP AI Hackathon 2026</span>
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
