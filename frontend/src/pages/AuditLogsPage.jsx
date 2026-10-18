import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, History } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { exportAuditLogsCsv } from '../utils/exportUtils';
import StatusTag from '../components/common/StatusTag';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getAuditLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#E2E8F0] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0A2540] tracking-tight">
              Immutable Forensic Audit Trail
            </h1>
            <span className="font-mono text-[10px] bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2 py-0.5 rounded-[4px] font-semibold">
              APPEND-ONLY LOG
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Cryptographic ledger tracking all automated detections and human controller sign-offs
          </p>
        </div>
        <button
          onClick={() => exportAuditLogsCsv(logs)}
          className="border border-[#CBD5E1] hover:border-[#0A2540] bg-white text-[#0A2540] text-xs font-semibold px-3 py-1.5 rounded-[4px] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[920px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-mono text-[#64748B] uppercase font-semibold whitespace-nowrap">
                <th className="py-2.5 px-4">Event ID</th>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Target Invoice</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Audit Details &amp; Justification</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">{log.id}</td>
                  <td className="py-3 px-4 font-mono text-xs text-[#0A2540]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-[#0A2540]">
                    {log.invoice_number || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-semibold bg-[#F1F5F9] text-[#0A2540] border border-[#E2E8F0] px-2 py-0.5 rounded-[4px]">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0A2540]">{log.actor}</td>
                  <td className="py-3 px-4 text-[#475569] max-w-md leading-relaxed">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
