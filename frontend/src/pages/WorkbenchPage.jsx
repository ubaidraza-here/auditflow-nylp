import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import WorkbenchCaseHeader from '../features/approval-workbench/WorkbenchCaseHeader';
import DocumentEvidencePane from '../features/approval-workbench/DocumentEvidencePane';
import DiscrepancyAlertList from '../features/approval-workbench/DiscrepancyAlertList';
import LineItemReconcileTable from '../features/approval-workbench/LineItemReconcileTable';
import HumanDecisionBar from '../features/approval-workbench/HumanDecisionBar';
import DispositionBanner from '../features/approval-workbench/DispositionBanner';
import DisputeEmailModal from '../features/approval-workbench/DisputeEmailModal';
import { apiClient } from '../services/apiClient';
import { exportInvoiceDossier } from '../utils/exportUtils';


export default function WorkbenchPage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [highlightDiscrepancies, setHighlightDiscrepancies] = useState(true);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const fetchInvoice = async () => {
    const data = await apiClient.getInvoiceById(invoiceId);
    setInvoice(data);
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const handleDecision = async (decision, notes) => {
    const res = await apiClient.submitDecision(invoice?.invoice_id, {
      decision,
      reviewer_name: 'Ubaid Raza — Senior AP Forensic Auditor',
      justification_notes: notes,
    });
    if (res?.updated_invoice) {
      setInvoice({ ...res.updated_invoice });
    }
    setIsDisputeOpen(false);
  };

  const handleResetDemo = async () => {
    const fresh = await apiClient.resetInvoiceState(invoice?.invoice_id);
    if (fresh) setInvoice({ ...fresh });
  };

  const handleExport = () => {
    exportInvoiceDossier(invoice);
  };


  if (!invoice) {
    return (
      <div className="p-12 text-center font-mono text-xs text-[#64748B]">
        Retrieving encrypted forensic audit record from ledger...
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 md:px-6 py-5 flex flex-col space-y-5 select-none">
      {/* 1. Sub-Header Case Controller */}
      <WorkbenchCaseHeader
        invoice={invoice}
        onResetCase={handleResetDemo}
        onExport={handleExport}
      />

      {/* 2. Split-Screen Layout */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Optical Evidence Canvas (5 Cols) */}
        <div className="xl:col-span-5">
          <DocumentEvidencePane
            invoice={invoice}
            highlightDiscrepancies={highlightDiscrepancies}
            onToggleHighlight={() => setHighlightDiscrepancies(!highlightDiscrepancies)}
          />
        </div>

        {/* Right Pane: 3-Way Reconciliation & Governance (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-4">
          <DispositionBanner
            invoice={invoice}
            onResetDemo={handleResetDemo}
            onExport={handleExport}
          />

          <DiscrepancyAlertList discrepancies={invoice.discrepancies} />

          <LineItemReconcileTable
            comparisons={invoice.line_item_comparisons}
            matchedPo={invoice.matched_purchase_order}
            invoiceNumber={invoice.invoice_number}
          />

          <HumanDecisionBar
            invoice={invoice}
            onApproveClean={() => handleDecision('APPROVE_CLEAN', 'Approved clean match for ERP release.')}
            onOpenDispute={() => setIsDisputeOpen(true)}
            onOverrideApprove={(notes) => handleDecision('APPROVE_WITH_OVERRIDE', notes)}
            onExport={handleExport}
          />
        </div>
      </div>

      {/* Screen 3: Formal Corporate Accounting Dispute Memorandum Modal */}
      {isDisputeOpen && (
        <DisputeEmailModal
          isOpen={isDisputeOpen}
          onClose={() => setIsDisputeOpen(false)}
          invoice={invoice}
          onConfirmRejection={({ justification_notes }) => {
            handleDecision('REJECT_DISPUTE', justification_notes);
          }}
        />
      )}
    </div>
  );
}
