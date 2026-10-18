import React, { useState, useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import QuickAuditModal from './components/layout/QuickAuditModal';
import DashboardPage from './pages/DashboardPage';
import WorkbenchPage from './pages/WorkbenchPage';
import UploadPage from './pages/UploadPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import { apiClient } from './services/apiClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('inv_1002');
  const [quickAuditOpen, setQuickAuditOpen] = useState(false);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickAuditOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('workbench');
  };

  const handleSelectScenario = (scenarioId, invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('workbench');
  };

  const handleResetLedger = async () => {
    await apiClient.resetLedger();
    setActiveTab('dashboard');
  };

  return (
    <AppShell
      activeTab={activeTab}
      onNavigate={setActiveTab}
      onOpenQuickAudit={() => setQuickAuditOpen(true)}
    >
      {activeTab === 'dashboard' && (
        <DashboardPage onSelectInvoice={handleSelectInvoice} />
      )}

      {activeTab === 'workbench' && (
        <WorkbenchPage
          invoiceId={selectedInvoiceId}
          onBack={() => setActiveTab('dashboard')}
          onNavigateAuditTrail={() => setActiveTab('audit-logs')}
        />
      )}

      {activeTab === 'upload' && (
        <UploadPage onSelectInvoice={handleSelectInvoice} />
      )}

      {activeTab === 'pos' && (
        <PurchaseOrdersPage />
      )}

      {activeTab === 'audit-logs' && (
        <AuditLogsPage />
      )}

      {/* Quick Audit Command Modal */}
      <QuickAuditModal
        isOpen={quickAuditOpen}
        onClose={() => setQuickAuditOpen(false)}
        onSelectInvoice={handleSelectInvoice}
        onSelectScenario={handleSelectScenario}
        onReset={handleResetLedger}
      />
    </AppShell>
  );
}
