import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Triage Ledger', path: '/', exact: true },
  { label: 'Forensic Workbench', path: '/workbench/inv_1002', prefix: '/workbench' },
  { label: 'Invoice Intake', path: '/upload' },
  { label: 'PO Registry', path: '/purchase-orders' },
  { label: 'Audit Trail', path: '/audit-logs' },
];

export default function CommandHeader({ onOpenQuickAudit }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isItemActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    if (item.prefix) return location.pathname.startsWith(item.prefix);
    return location.pathname === item.path;
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white border-b border-[#E2E8F0] px-4 md:px-6 flex items-center justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* Left: Brand Identity & Tier Tag */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer text-left bg-transparent border-0 p-0"
        >
          <div className="w-9 h-9 rounded-md bg-[#0A2540] flex items-center justify-center text-white font-mono font-bold text-xs tracking-wider shadow-sm">
            AF
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-sm font-bold text-[#0A2540] tracking-tight leading-none">
              AuditFlow
            </span>
            <span className="font-mono text-[9px] text-[#64748B] tracking-wider uppercase mt-0.5">
              Financial Forensics
            </span>
          </div>
        </button>

        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0]">
          v1.0
        </span>
      </div>

      {/* Center: Segmented Navigation Pill Bar */}
      <nav className="hidden lg:flex items-center bg-[#F4F6F8] p-1 rounded-lg border border-[#E2E8F0]">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`px-3 py-1.5 rounded-md text-xs transition-all duration-150 font-medium ${active
                ? 'bg-[#0A2540] text-white shadow-xs font-semibold'
                : 'text-[#475569] hover:text-[#0A2540] hover:bg-white/60'
                }`}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Right: Quick Audit (⌘K), Gemini Status, and Action CTA */}
      <div className="flex items-center gap-2.5">
        <div className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium tracking-tight border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
          <span>Gemini 3.5 </span>
        </div>
        {onOpenQuickAudit && (
          <button
            type="button"
            onClick={onOpenQuickAudit}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white text-xs text-[#475569] hover:text-[#0A2540] transition-colors cursor-pointer shadow-2xs"
            title="Quick Audit Command Palette (Ctrl+K / ⌘K)"
          >
            <span className="material-symbols-outlined text-[15px]">search</span>
            <span className="font-medium text-[11px]">Quick Audit</span>
            <kbd className="px-1 py-0.2 rounded-[4px] bg-white border border-[#CBD5E1] font-mono text-[9px] text-[#64748B]">⌘K</kbd>
          </button>
        )}



        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-1.5 bg-[#0A2540] hover:bg-[#1E3A5F] active:bg-[#06182B] text-white rounded-lg px-3.5 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
        </button>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-1.5 text-[#475569] hover:text-[#0A2540] rounded-md border border-[#E2E8F0]"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-[20px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-[#E2E8F0] p-4 flex flex-col gap-1.5 shadow-xl z-50">
          {onOpenQuickAudit && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuickAudit();
              }}
              className="px-3 py-2 text-left rounded-md text-xs font-medium text-[#0A2540] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"
            >
              <span>Quick Audit Search (⌘K)</span>
              <kbd className="font-mono text-[10px]">⌘K</kbd>
            </button>
          )}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-md text-xs font-medium ${isItemActive(item)
                ? 'bg-[#0A2540] text-white font-semibold'
                : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0A2540]'
                }`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
