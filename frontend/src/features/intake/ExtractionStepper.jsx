import React from 'react';

export default function ExtractionStepper({
  stepState = { step: 0, status: 'IDLE' },
  targetFile = null,
  resultInvoice = null,
  onOpenWorkbench,
}) {
  const isRunning = stepState.status === 'RUNNING';
  const isFinished = stepState.status === 'FINISHED';
  const currentStep = stepState.step;

  const fileName = targetFile?.name || resultInvoice?.invoice_number || 'INV-9042_APEX_TECH.PNG';
  const fileHash = targetFile?.hash || resultInvoice?.file_hash_sha256 || 'e3b0c44298fc1c14...96fb924';
  const hasExactDuplicate = resultInvoice?.discrepancies?.some((d) => d.rule_code === 'EXACT_FILE_DUPLICATE');
  const hasExceptions = (resultInvoice?.discrepancies?.length || 0) > 0;

  return (
    <div className="xl:col-span-5 bg-white border border-[#CBD5E1] rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        {/* Top Header Bar */}
        <div className="bg-[#111110] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#94A3B8] text-[18px]">account_tree</span>
            <span className="font-sans text-xs font-semibold tracking-wide">
              Multimodal Verification Pipeline
            </span>
          </div>
          <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium tracking-tight inline-flex items-center gap-1.5 border bg-white/10 text-white border-white/20">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-[#38BDF8] animate-ping' : isFinished ? 'bg-[#16A34A]' : 'bg-[#94A3B8]'
              }`}
            />
            <span>{isRunning ? `Step 0${currentStep} Active` : isFinished ? 'Verification Complete' : 'Ready / Active'}</span>
          </span>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3 bg-white">
          {/* Active Payload Reference */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3 text-xs">
            <div className="text-[10px] text-[#64748B] uppercase font-semibold">Active Ingestion Target:</div>
            <div className="font-mono text-xs text-[#0F172A] font-bold mt-0.5 truncate">{fileName}</div>
            <div className="font-mono text-[10px] text-[#64748B] mt-1 truncate">
              SHA-256: {fileHash.slice(0, 32)}...
            </div>
          </div>

          {/* Step 01 */}
          <div className={`border rounded-md p-3.5 flex items-start justify-between gap-3 transition-colors ${
            currentStep === 1 && isRunning ? 'bg-[#F0F9FF] border-[#BAE6FD]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div className="space-y-1">
              <div className="text-[#0F172A] font-medium text-xs flex items-center gap-1.5">
                <span>Step 01</span>
                <span className="font-mono text-[#64748B] text-[11px]">[18ms]</span>
                <span>SHA-256 Hash Duplicate Check</span>
              </div>
              <p className="text-[#475569] text-[11px] leading-relaxed">
                {currentStep >= 1 ? 'Cryptographic hash generated & tested against immutable ledger.' : 'Pending input stream.'}
              </p>
            </div>
            <span className={`rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium inline-flex items-center gap-1.5 border shrink-0 ${
              currentStep === 1 && isRunning
                ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                : currentStep > 1 && hasExactDuplicate
                ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                : currentStep > 1
                ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
            }`}>
              {currentStep === 1 && isRunning ? 'RUNNING...' : currentStep > 1 && hasExactDuplicate ? 'DUPLICATE' : currentStep > 1 ? 'CLEARED' : 'PENDING'}
            </span>
          </div>

          {/* Step 02 */}
          <div className={`border rounded-md p-3.5 flex items-start justify-between gap-3 transition-colors ${
            currentStep === 2 && isRunning ? 'bg-[#F0F9FF] border-[#BAE6FD]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div className="space-y-1">
              <div className="text-[#0F172A] font-medium text-xs flex items-center gap-1.5">
                <span>Step 02</span>
                <span className="font-mono text-[#64748B] text-[11px]">[340ms]</span>
                <span>Gemini 3.5 Flash Vision OCR</span>
              </div>
              <p className="text-[#475569] text-[11px] leading-relaxed">
                {currentStep >= 2 ? 'Multimodal visual line mapping against active PO catalog.' : 'Awaiting document tokenization.'}
              </p>
            </div>
            <span className={`rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium inline-flex items-center gap-1.5 border shrink-0 ${
              currentStep === 2 && isRunning
                ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                : currentStep > 2
                ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
            }`}>
              {currentStep === 2 && isRunning ? 'RUNNING...' : currentStep > 2 ? 'PARSED' : 'PENDING'}
            </span>
          </div>

          {/* Step 03 */}
          <div className={`border rounded-md p-3.5 flex items-start justify-between gap-3 transition-colors ${
            currentStep === 3 && isRunning ? 'bg-[#F0F9FF] border-[#BAE6FD]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div className="space-y-1">
              <div className="text-[#0F172A] font-medium text-xs flex items-center gap-1.5">
                <span>Step 03</span>
                <span className="font-mono text-[#64748B] text-[11px]">[48ms]</span>
                <span>7-Rule Math &amp; PO Reconciliation</span>
              </div>
              <p className="text-[#475569] text-[11px] leading-relaxed">
                {isFinished && hasExceptions
                  ? `${resultInvoice.discrepancies.length} discrepancy exceptions flagged for auditor review.`
                  : isFinished
                  ? '3-way reconciliation verified clean with 0 financial variance.'
                  : 'Awaiting deterministic rule execution.'}
              </p>
            </div>
            <span className={`rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium inline-flex items-center gap-1.5 border shrink-0 ${
              currentStep === 3 && isRunning
                ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                : isFinished && hasExceptions
                ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                : isFinished
                ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
            }`}>
              {currentStep === 3 && isRunning ? 'RUNNING...' : isFinished && hasExceptions ? 'EXCEPTION' : isFinished ? 'COMPLETE' : 'PENDING'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Metrics & Navigation Action */}
      <div className="p-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
        <div className="flex items-center gap-2 text-[11px]">
          <span>LATENCY: <strong className="tabular-nums text-[#0A2540]">{resultInvoice?.processing_latency_ms || 406}ms</strong></span>
          <span>•</span>
          <span>MODE: <strong className={resultInvoice?.extraction_mode === 'GEMINI_LIVE' ? 'text-[#16A34A] font-mono' : 'text-[#D97706] font-mono'}>{resultInvoice?.extraction_mode || 'READY'}</strong></span>
        </div>

        {isFinished && onOpenWorkbench ? (
          <button
            type="button"
            onClick={onOpenWorkbench}
            className="inline-flex items-center gap-1.5 bg-[#0A2540] hover:bg-[#1E3A5F] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs cursor-pointer transition-all animate-pulse"
          >
            <span>Open Forensic Workbench</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        ) : (
          <span className="text-[11px] font-mono text-[#64748B]">AUDIT: SHA_ACTIVE</span>
        )}
      </div>
    </div>
  );
}
