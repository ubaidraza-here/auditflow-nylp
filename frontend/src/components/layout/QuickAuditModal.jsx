import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { exportLedgerCsv } from '../../utils/exportUtils';
import QuickAuditItem from './QuickAuditItem';

export default function QuickAuditModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [resetting, setResetting] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      apiClient.getDashboardSummary().then((res) => setInvoices(res?.invoices || []));
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const defaultActions = useMemo(
    () => [
      { id: 'nav-ledger', type: 'NAV', title: 'Triage Ledger (Executive Overview)', path: '/', icon: 'table_chart' },
      { id: 'nav-intake', type: 'NAV', title: 'Invoice Intake (Multimodal Pipeline)', path: '/upload', icon: 'upload_file' },
      { id: 'nav-workbench', type: 'NAV', title: 'Forensic Workbench (INV-9042)', path: '/workbench/inv_1002', icon: 'biotech' },
      { id: 'nav-pos', type: 'NAV', title: 'PO Baseline Registry', path: '/purchase-orders', icon: 'inventory' },
      { id: 'nav-audit', type: 'NAV', title: 'Immutable Audit Trail', path: '/audit-logs', icon: 'verified_user' },
      {
        id: 'act-reset',
        type: 'ACTION',
        title: '⚡ 1-Click System Demo Reset (Pristine Blueprint)',
        icon: 'restart_alt',
        action: async () => {
          setResetting(true);
          await apiClient.resetAll();
          setResetting(false);
          onClose();
          window.location.reload();
        },
      },
      {
        id: 'act-csv',
        type: 'ACTION',
        title: '📥 Export Immutable Ledger (CSV)',
        icon: 'download',
        action: () => {
          exportLedgerCsv(invoices);
          onClose();
        },
      },
    ],
    [invoices, onClose]
  );

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    const invoiceItems = invoices.map((inv) => ({
      id: `inv-${inv.invoice_id}`,
      type: 'INVOICE',
      title: `${inv.invoice_number} • ${inv.vendor_name}`,
      subtitle: `${inv.po_reference || 'No PO'} | $${(inv.grand_total || 0).toLocaleString()} | ${inv.status}`,
      path: `/workbench/${inv.invoice_id}`,
      icon: 'receipt_long',
    }));

    const all = [...defaultActions, ...invoiceItems];
    if (!q) return all;
    return all.filter((i) => i.title.toLowerCase().includes(q) || (i.subtitle && i.subtitle.toLowerCase().includes(q)));
  }, [query, defaultActions, invoices]);

  const handleSelect = (item) => {
    if (item.action) item.action();
    else if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((p) => (p + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((p) => (p - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, top: 0, left: 0, right: 0, bottom: 0, margin: 0, zIndex: 9999 }}
      className="fixed inset-0 z-[9999] m-0 bg-slate-950/60 backdrop-blur-md flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-3.5 border-b border-[#E2E8F0] flex items-center gap-2.5 bg-[#F8FAFC]">
          <span className="material-symbols-outlined text-[#64748B] text-[20px]">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search invoice # (INV-9042), vendor, PO, command..."
            className="flex-1 bg-transparent border-0 font-sans text-xs text-[#0A2540] placeholder:text-[#94A3B8] focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white border border-[#CBD5E1] font-mono text-[10px] text-[#64748B]">ESC</kbd>
        </div>

        <div className="overflow-y-auto divide-y divide-[#F1F5F9] p-1.5 flex-1 text-xs">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-[#64748B] font-mono text-xs">No matching records found.</div>
          ) : (
            filteredItems.map((item, idx) => (
              <QuickAuditItem
                key={item.id}
                item={item}
                isSelected={selectedIndex === idx}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>

        <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B] font-mono">
          <span>{resetting ? 'Resetting system...' : 'AuditFlow Command Palette'}</span>
          <span>Use ↑↓ to navigate • ↵ to select</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
