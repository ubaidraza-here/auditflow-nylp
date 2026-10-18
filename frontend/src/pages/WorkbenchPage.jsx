import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Download } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { exportInvoiceJson } from '../utils/exportUtils';
import StatusTag from '../components/common/StatusTag';
import DocumentEvidencePane from '../features/approval-workbench/DocumentEvidencePane';
import DiscrepancyAlertList from '../features/approval-workbench/DiscrepancyAlertList';
import LineItemReconcileTable from '../features/approval-workbench/LineItemReconcileTable';
import HumanDecisionBar from '../features/approval-workbench/HumanDecisionBar';
import DisputeEmailModal from '../features/approval-workbench/DisputeEmailModal';

const QUICK_CASES = [
  { id: 'inv_1002', label: 'INV-9042 (+$450 Overrun)' },
  { id: 'inv_1001', label: 'INV-8801 (Clean Match)' },
  { id: 'inv_1003', label: 'INV-7710-REV (Duplicate)' }
];

export default function WorkbenchPage({ invoiceId = 'inv_1002', onBack, onNavigateAuditTrail }) {
  const [currentId, setCurrentId] = useState(invoiceId);
  const [invoice, setInvoice] = useState(null);
  const [po, setPo] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  useEffect(() => {
    if (invoiceId) setCurrentId(invoiceId);
  }, [invoiceId]);

  const loadData = async (targetId) => {
    const inv = await apiClient.getInvoice(targetId);
    setInvoice(inv);
    if (inv?.po_reference) {
      const pos = await apiClient.getPurchaseOrders();
      setPo(pos.find(p => p.po_number === inv.po_reference) || null);
    }
  };

  useEffect(() => { loadData(currentId); }, [currentId]);

  const handleApproveClean = async () => {
    await apiClient.submitDecision(invoice.id, { decision: 'APPROVE_CLEAN', reviewer_name: 'Ubaid Raza' });
    await loadData(currentId);
  };

  const handleApproveOverride = async (reason) => {
    await apiClient.submitDecision(invoice.id, { decision: 'APPROVE_WITH_OVERRIDE', reviewer_name: 'Ubaid Raza', override_reason: reason });
    await loadData(currentId);
  };

  const handleConfirmDispute = async (subj, body) => {
    await apiClient.submitDecision(invoice.id, { decision: 'REJECT_DISPUTE', reviewer_name: 'Ubaid Raza', dispute_email_body: body });
    await loadData(currentId);
  };

  const handleReset = async () => {
    await apiClient.resetLedger();
    await loadData(currentId);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Sub-Header Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3 mb-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="border border-[#CBD5E1] hover:border-[#0A2540] bg-white text-[#0A2540] text-xs font-semibold px-2.5 py-1.5 rounded-[4px] shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Queue</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#0A2540] font-mono tracking-tight">Case #{invoice?.invoice_number || 'INV-9042'}</h1>
              <span className="text-xs text-[#64748B] font-medium">— {invoice?.vendor_name}</span>
              <StatusTag status={invoice?.status} />
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[#64748B]">
              <span>SHA-256: {invoice?.sha256_hash?.slice(0, 16)}...</span>
              <span>•</span>
              <span>Baseline: {invoice?.po_reference}</span>
            </div>
          </div>
        </div>

        {/* Segmented Switcher & Quick Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInvoiceJson(invoice)}
            className="border border-[#CBD5E1] hover:border-[#0A2540] bg-white text-[#0A2540] text-xs font-semibold px-2.5 py-1.5 rounded-[4px] shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Export JSON</span>
          </button>
          <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-[6px] border border-[#E2E8F0]">
            {QUICK_CASES.map(c => (
              <button
                key={c.id}
                onClick={() => setCurrentId(c.id)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-[4px] transition-all cursor-pointer ${
                  currentId === c.id ? 'bg-white text-[#0A2540] font-semibold shadow-2xs' : 'text-[#64748B] hover:text-[#0A2540]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleReset}
            title="Reset Seed Ledger State"
            className="p-1.5 border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] rounded-[4px] shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 12-Column Split-Screen Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col">
          <DocumentEvidencePane invoice={invoice} />
        </div>
        <div className="lg:col-span-7 flex flex-col">
          <DiscrepancyAlertList invoice={invoice} />
          <LineItemReconcileTable invoice={invoice} po={po} />
          <HumanDecisionBar
            invoice={invoice}
            onApproveClean={handleApproveClean}
            onApproveOverride={handleApproveOverride}
            onOpenDispute={() => setDisputeModalOpen(true)}
            onResetState={handleReset}
            onViewAuditTrail={onNavigateAuditTrail}
          />
        </div>
      </div>

      <DisputeEmailModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        invoice={invoice}
        onConfirmDispute={handleConfirmDispute}
      />
    </div>
  );
}
