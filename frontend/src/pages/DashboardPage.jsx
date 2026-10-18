import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import KpiMetricStrip from '../components/layout/KpiMetricStrip';
import DemoScenarioCards from '../features/invoice-intake/DemoScenarioCards';
import InvoiceQueueTable from '../components/dashboard/InvoiceQueueTable';
import { apiClient } from '../services/apiClient';

export default function DashboardPage() {
  const [data, setData] = useState({ kpis: null, invoices: [] });
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const res = await apiClient.getDashboardSummary();
      setData(res || { kpis: null, invoices: [] });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isUnresolvedFlagged = (i) =>
    ['EXCEPTION_FLAGGED', 'NEEDS_REVIEW', 'FLAGGED'].includes(i.status);
  const isCleanMatch = (i) =>
    ['MATCHED_APPROVED', 'AUTO_APPROVED', 'APPROVED', 'VERIFIED_MATCH', 'APPROVED_CLEAN', 'Approved Clean'].includes(i.status) &&
    (i.discrepancies?.length || 0) === 0 &&
    Math.abs(Number(i.total_variance_amount || i.variance_amount || 0)) === 0;
  const isArchived = (i) =>
    ['APPROVED_WITH_OVERRIDE', 'APPROVED_OVERRIDE', 'REJECTED_DISPUTED', 'DISPUTED', 'REJECTED', 'ARCHIVED'].includes(i.status) ||
    Boolean(i.decision_metadata && !isCleanMatch(i));

  const tabCounts = useMemo(() => {
    const list = data.invoices || [];
    return {
      all: list.length,
      anomalies: list.filter(isUnresolvedFlagged).length,
      clean: list.filter(isCleanMatch).length,
      archive: list.filter(isArchived).length,
    };
  }, [data.invoices]);

  const filteredInvoices = useMemo(() => {
    const query = search.toLowerCase().trim();
    return (data.invoices || []).filter((inv) => {
      const matchesSearch =
        !query ||
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.vendor_name?.toLowerCase().includes(query) ||
        inv.po_reference?.toLowerCase().includes(query) ||
        inv.extracted_data?.vendor_tax_id?.toLowerCase().includes(query) ||
        inv.extracted_data?.iban_or_account?.toLowerCase().includes(query) ||
        inv.file_hash_sha256?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (activeTab === 'all') return true;
      if (activeTab === 'anomalies') return isUnresolvedFlagged(inv);
      if (activeTab === 'clean') return isCleanMatch(inv);
      if (activeTab === 'archive') return isArchived(inv);
      return true;
    });
  }, [data.invoices, activeTab, search]);

  const handleResetFilters = async () => {
    setActiveTab('all');
    setSearch('');
    try {
      const fresh = await apiClient.resetDashboardState();
      if (fresh) setData(fresh);
    } catch (err) {
      console.error('Failed to reset dashboard state:', err);
    }
  };

  const handleInspect = (invoiceId) => {
    navigate(`/workbench/${invoiceId}`);
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 md:px-6 py-6 space-y-6">
      {/* Executive KPI Metric Cards */}
      <KpiMetricStrip
        kpis={data.kpis}
        invoices={data.invoices}
        totalInvoicesCount={data.invoices?.length || 6}
      />

      {/* Interactive Synthetic Scenario Bar */}
      <DemoScenarioCards
        onReset={handleResetFilters}
        onScenarioTriggered={() => loadData()}
      />

      {/* Forensic Invoice Ledger Table */}
      <InvoiceQueueTable
        invoices={filteredInvoices}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabCounts={tabCounts}
        search={search}
        onSearchChange={setSearch}
        onInspect={handleInspect}
      />
    </div>
  );
}
