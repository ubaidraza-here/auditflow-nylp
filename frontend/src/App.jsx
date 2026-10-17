import React, { useState, useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import QuickAuditModal from './components/layout/QuickAuditModal';
import DashboardPage from './pages/DashboardPage';
import WorkbenchPage from './pages/WorkbenchPage';

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
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-12 max-w-lg mx-auto shadow-xs">
            <div className="w-10 h-10 bg-[#0A2540] text-white font-mono font-bold rounded flex items-center justify-center mx-auto mb-4">
              03
            </div>
            <h2 className="text-lg font-bold text-[#0A2540] mb-2">
              Invoice Intake &amp; Multimodal Pipeline
            </h2>
            <p className="text-xs text-[#64748B] mb-4">
              Scheduled for Segment 3 implementation with HTML5 Canvas Sample Generator.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-xs font-semibold text-[#0A2540] hover:text-[#1E3A5F] underline"
            >
              ← Return to Executive Triage Ledger
            </button>
          </div>
        </div>
      )}

      {activeTab === 'pos' && (
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-12 max-w-lg mx-auto shadow-xs">
            <div className="w-10 h-10 bg-[#0A2540] text-white font-mono font-bold rounded flex items-center justify-center mx-auto mb-4">
              04
            </div>
            <h2 className="text-lg font-bold text-[#0A2540] mb-2">
              ERP Purchase Order Registry
            </h2>
            <p className="text-xs text-[#64748B] mb-4">
              Authorized procurement baselines view scheduled for Segment 4.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-xs font-semibold text-[#0A2540] hover:text-[#1E3A5F] underline"
            >
              ← Return to Executive Triage Ledger
            </button>
          </div>
        </div>
      )}

      {activeTab === 'audit-logs' && (
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-12 max-w-lg mx-auto shadow-xs">
            <div className="w-10 h-10 bg-[#0A2540] text-white font-mono font-bold rounded flex items-center justify-center mx-auto mb-4">
              05
            </div>
            <h2 className="text-lg font-bold text-[#0A2540] mb-2">
              Immutable Cryptographic Audit Trail
            </h2>
            <p className="text-xs text-[#64748B] mb-4">
              Historical ledger transitions view scheduled for Segment 4.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-xs font-semibold text-[#0A2540] hover:text-[#1E3A5F] underline"
            >
              ← Return to Executive Triage Ledger
            </button>
          </div>
        </div>
      )}

      {/* Quick Audit Command Modal */}
      <QuickAuditModal
        isOpen={quickAuditOpen}
        onClose={() => setQuickAuditOpen(false)}
        onSelectInvoice={handleSelectInvoice}
        onSelectScenario={handleSelectScenario}
      />
    </AppShell>
  );
}
