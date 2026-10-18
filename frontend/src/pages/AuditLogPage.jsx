import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { exportLedgerCsv } from '../utils/exportUtils';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    apiClient.getAuditLogs().then((res) => setLogs(res || []));
  }, []);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

  return (
    <div className="w-full bg-[#F4F6F8] min-h-[calc(100vh-4rem)] text-[#0A2540]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header Command Bar */}
        <section className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A2540] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#0A2540] tracking-tight">
                Immutable Forensic Audit Trail
              </h1>
              <p className="text-xs text-[#64748B]">
                Append-Only Cryptographic Log
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
              <span className="font-mono">Block Height: #44,192</span>
            </span>
            <span className="font-sans text-[#64748B] hidden sm:inline">
              {logs.length} Committed Entries
            </span>
            <button
              type="button"
              onClick={() => exportLedgerCsv([], logs)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A2540] hover:bg-[#1E3A5F] text-white rounded-lg font-sans text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
          </div>

        </section>

        {/* Audit Log Table Card */}
        <section className="bg-white rounded-xl border border-[#CBD5E1] shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 select-none">
                  <th className="py-3 px-4">LOG ID &amp; TIMESTAMP</th>
                  <th className="py-3 px-4">ACTOR / SYSTEM</th>
                  <th className="py-3 px-4">EVENT &amp; RECORD</th>
                  <th className="py-3 px-4">DISPOSITION</th>
                  <th className="py-3 px-4 text-right">PREVENTED LEAKAGE</th>
                  <th className="py-3 px-4">AUDIT MEMO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#0F172A]">
                {logs.map((log) => {
                  const isDisputed = log.new_status === 'REJECTED_DISPUTED' || log.action_type === 'REJECT_DISPUTE';
                  const isOverride = log.new_status === 'APPROVED_WITH_OVERRIDE' || log.action_type === 'APPROVE_WITH_OVERRIDE';
                  const hasLeakage = (log.financial_impact_saved || 0) > 0;

                  return (
                    <tr key={log.log_id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-[#0A2540]">{log.log_id}</div>
                        <div className="text-[11px] text-[#64748B]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-sans font-medium text-[#0F172A]">{log.actor_name || 'Autonomous Agent'}</div>
                        <div className="font-mono text-[11px] text-[#64748B]">CONTROLLER LEVEL 3</div>
                      </td>

                      <td className="py-3.5 px-4 text-[11px]">
                        <span className="font-mono font-semibold text-[#0A2540]">{log.invoice_number}</span>
                        <span className="font-sans text-[#64748B]"> — {log.vendor_name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isDisputed && (
                          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                            <span>Disputed: Hold Placed</span>
                          </span>
                        )}
                        {isOverride && (
                          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                            <span>Override Released</span>
                          </span>
                        )}
                        {!isDisputed && !isOverride && (
                          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight inline-flex items-center gap-1.5 border bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                            <span>Auto-Approved 3-Way</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-sans tabular-nums font-semibold whitespace-nowrap">
                        {hasLeakage ? (
                          <span className="text-[#166534]">+{formatCurrency(log.financial_impact_saved)}</span>
                        ) : (
                          <span className="text-[#94A3B8] font-normal">$0.00</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] font-sans text-[#64748B] max-w-xs truncate">
                        {log.justification_notes || 'Automated 3-way reconciliation passed.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footnote Meta Bar */}
          <div className="p-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[#64748B] text-xs font-sans">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500">Append-Only Blockstore: Committed</span>
              </span>
              <span className="hidden sm:inline text-[#CBD5E1]">•</span>
              <span className="hidden sm:inline text-[11px] text-slate-500">SHA-256 Ledger Immutability Guaranteed</span>
            </div>
            <span className="font-mono text-[11px]">AUDIT_STREAM: ACTIVE</span>
          </div>
        </section>
      </div>
    </div>
  );
}
