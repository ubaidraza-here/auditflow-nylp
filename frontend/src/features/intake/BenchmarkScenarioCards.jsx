import React from 'react';

export default function BenchmarkScenarioCards({ onSelectScenario, disabled = false }) {
  return (
    <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 block mb-2.5">
        Interactive Benchmark Scenarios (Single-Click Test Intake):
      </span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectScenario('SCENARIO_B_OVERCHARGE')}
          className="flex flex-col text-left p-2.5 bg-white border border-[#CBD5E1] border-l-4 border-l-[#9F1239] rounded-lg hover:bg-[#F8FAFC] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#991B1B]">⚡ Case A (INV-9042)</span>
            <span className="rounded-[4px] px-1.5 py-0.2 text-[10px] bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] font-semibold">
              +$450 Over
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] truncate mt-1">Apex_Overcharge_INV9042.png</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectScenario('SCENARIO_A_CLEAN')}
          className="flex flex-col text-left p-2.5 bg-white border border-[#CBD5E1] border-l-4 border-l-[#16A34A] rounded-lg hover:bg-[#F8FAFC] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#166534]">⚡ Case B (INV-8801)</span>
            <span className="rounded-[4px] px-1.5 py-0.2 text-[10px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-semibold">
              $950 Match
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] truncate mt-1">CloudHost_Clean_INV8801.pdf</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectScenario('SCENARIO_C_DUPLICATE')}
          className="flex flex-col text-left p-2.5 bg-white border border-[#CBD5E1] border-l-4 border-l-[#D97706] rounded-lg hover:bg-[#F8FAFC] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#92400E]">⚡ Case C (INV-7710)</span>
            <span className="rounded-[4px] px-1.5 py-0.2 text-[10px] bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-semibold">
              Vector Dup
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] truncate mt-1">PrimeOffice_Dup_INV7710.png</span>
        </button>
      </div>
    </div>
  );
}
