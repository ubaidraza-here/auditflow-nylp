import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import KpiMetricStrip from '../features/command-center/KpiMetricStrip';
import DemoScenarioCards from '../features/command-center/DemoScenarioCards';
import InvoiceQueueTable from '../features/command-center/InvoiceQueueTable';

export default function DashboardPage({ onSelectInvoice }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ kpis: {}, invoices: [] });
  const [loadingScenarioId, setLoadingScenarioId] = useState(null);
  const [resetting, setResetting] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getDashboardSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSelectScenario = async (scenarioId, invoiceId) => {
    setLoadingScenarioId(scenarioId);
    try {
      const res = await apiClient.analyzeDemoScenario(scenarioId);
      await fetchSummary();
      if (res?.invoice?.id) {
        onSelectInvoice(res.invoice.id);
      } else {
        onSelectInvoice(invoiceId);
      }
    } catch (err) {
      console.error('Scenario error:', err);
      onSelectInvoice(invoiceId);
    } finally {
      setLoadingScenarioId(null);
    }
  };

  const handleResetLedger = async () => {
    if (!window.confirm('Reset forensic ledger to factory baseline seed state?')) return;
    setResetting(true);
    try {
      await apiClient.resetLedger();
      await fetchSummary();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#E2E8F0] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0A2540] tracking-tight">
              Executive AP Triage Ledger
            </h1>
            <span className="font-mono text-[11px] bg-[#E2E8F0] text-[#334155] px-2 py-0.5 rounded-[4px] font-medium">
              3-WAY AUDIT ACTIVE
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Automated cryptographic deduplication &amp; neuro-symbolic reconciliation console
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#475569] text-xs font-semibold px-3 py-1.5 rounded-[4px] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleResetLedger}
            disabled={resetting}
            className="border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold px-3 py-1.5 rounded-[4px] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <KpiMetricStrip kpis={data.kpis} />

      {/* 1-Click Benchmark Scenarios */}
      <DemoScenarioCards
        onSelectScenario={handleSelectScenario}
        loadingScenarioId={loadingScenarioId}
      />

      {/* Triage Ledger Table */}
      <InvoiceQueueTable
        invoices={data.invoices}
        onSelectInvoice={onSelectInvoice}
      />
    </div>
  );
}
