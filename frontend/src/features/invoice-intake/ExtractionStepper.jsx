import React from 'react';
import { ShieldCheck, Cpu, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function ExtractionStepper({ activeStage, stageDetails }) {
  const steps = [
    {
      num: '01',
      title: 'SHA-256 Cryptographic Hash Check',
      desc: 'Validating against immutable ledger binary duplicates',
      detail: stageDetails?.sha256 ? `Hash: ${stageDetails.sha256.slice(0, 24)}...` : 'Pending file checksum computation',
      icon: ShieldCheck,
      stageNum: 1
    },
    {
      num: '02',
      title: 'Gemini 3.5 Flash Vision OCR',
      desc: 'Multimodal vision extraction & semantic line mapping',
      detail: stageDetails?.model ? `Active Model: ${stageDetails.model} (Latency: ${stageDetails.latency || '1,420ms'})` : 'Awaiting vision cascade initiation',
      icon: Cpu,
      stageNum: 2
    },
    {
      num: '03',
      title: 'Pure-Python 7-Rule Symbolic Auditor',
      desc: 'Deterministic math, rate matching & bank validation',
      detail: stageDetails?.verdict ? `Audit Verdict: ${stageDetails.verdict}` : 'Zero-LLM mathematical verification',
      icon: CheckCircle2,
      stageNum: 3
    }
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-xs overflow-hidden flex flex-col h-full font-sans">
      {/* Top #111110 Strip */}
      <div className="bg-[#111110] text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <h3 className="font-mono text-xs font-bold tracking-wider uppercase">
            Multimodal Verification Pipeline
          </h3>
        </div>
        <span className="font-mono text-[11px] text-[#94A3B8]">
          Stage {activeStage > 0 ? activeStage : 0} of 3
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#F1F5F9] h-1.5 overflow-hidden">
        <div
          className="bg-[#0A2540] h-1.5 transition-all duration-300"
          style={{ width: `${(Math.max(0, activeStage) / 3) * 100}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="p-5 space-y-4 flex-1">
        {steps.map((step) => {
          const isComplete = activeStage > step.stageNum;
          const isRunning = activeStage === step.stageNum;
          const isPending = activeStage < step.stageNum;
          const Icon = step.icon;

          return (
            <div
              key={step.num}
              className={`p-3.5 rounded-[6px] border transition-all ${
                isRunning
                  ? 'bg-[#F8FAFC] border-[#0A2540] shadow-2xs'
                  : isComplete
                  ? 'bg-[#F0FDF4]/40 border-[#BBF7D0]'
                  : 'bg-white border-[#E2E8F0] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
                    isComplete
                      ? 'bg-[#16A34A] text-white'
                      : isRunning
                      ? 'bg-[#0A2540] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}>
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : step.num}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#0A2540]">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div>
                  {isComplete && (
                    <span className="font-mono text-[10px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] px-2 py-0.5 rounded-[4px]">
                      PASSED
                    </span>
                  )}
                  {isRunning && (
                    <span className="font-mono text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-ping" />
                      RUNNING...
                    </span>
                  )}
                  {isPending && (
                    <span className="font-mono text-[10px] text-[#94A3B8]">
                      QUEUED
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-detail footer */}
              <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]/60 font-mono text-[10px] text-[#475569] flex items-center justify-between">
                <span>{step.detail}</span>
                {isComplete && <span className="text-[#16A34A] font-semibold">✓ Verified</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-5 py-3 text-[11px] text-[#64748B] flex items-center justify-between font-mono">
        <span>Deterministic Tolerance: $0.02</span>
        <span>Cascade: 3.5-flash → 3.5-lite</span>
      </div>
    </div>
  );
}
