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

  const tabCounts = useMemo(() => {
    const list = data.invoices || [];
    return {
      all: list.length,
      anomalies: list.filter(
        (i) => i.status === 'EXCEPTION_FLAGGED' || i.status === 'REJECTED_DISPUTED'
      ).length,
      clean: list.filter((i) => i.status === 'VERIFIED_MATCH').length,
      archive: list.filter(
        (i) => i.status === 'APPROVED_CLEAN' || i.status === 'APPROVED_WITH_OVERRIDE'
      ).length,
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
      if (activeTab === 'anomalies') {
        return (
          inv.status === 'EXCEPTION_FLAGGED' || inv.status === 'REJECTED_DISPUTED'
        );
      }
      if (activeTab === 'clean') {
        return inv.status === 'VERIFIED_MATCH';
      }
      if (activeTab === 'archive') {
        return (
          inv.status === 'APPROVED_CLEAN' ||
          inv.status === 'APPROVED_WITH_OVERRIDE'
        );
      }
      return true;
    });
  }, [data.invoices, activeTab, search]);

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearch('');
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
