import React from 'react';

const STATUS_CONFIGS = {
  VERIFIED_MATCH: {
    bg: 'bg-[#F0FDF4]', text: 'text-[#166534]', border: 'border-[#BBF7D0]', dot: 'bg-[#16A34A]', label: 'VERIFIED MATCH'
  },
  APPROVED_CLEAN: {
    bg: 'bg-[#F0FDF4]', text: 'text-[#166534]', border: 'border-[#BBF7D0]', dot: 'bg-[#16A34A]', label: 'APPROVED CLEAN'
  },
  EXCEPTION_FLAGGED: {
    bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]', border: 'border-[#FECACA]', dot: 'bg-[#DC2626]', label: 'EXCEPTION FLAGGED'
  },
  REJECTED_DISPUTED: {
    bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]', border: 'border-[#FECACA]', dot: 'bg-[#DC2626]', label: 'REJECTED / DISPUTED'
  },
  APPROVED_WITH_OVERRIDE: {
    bg: 'bg-[#F8FAFC]', text: 'text-[#334155]', border: 'border-[#E2E8F0]', dot: 'bg-[#64748B]', label: 'APPROVED OVERRIDE'
  },
  CRITICAL: {
    bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]', border: 'border-[#FECACA]', dot: 'bg-[#DC2626]', label: 'CRITICAL'
  },
  HIGH: {
    bg: 'bg-[#FFFBEB]', text: 'text-[#92400E]', border: 'border-[#FDE68A]', dot: 'bg-[#D97706]', label: 'HIGH RISK'
  },
  WARNING: {
    bg: 'bg-[#FFFBEB]', text: 'text-[#92400E]', border: 'border-[#FDE68A]', dot: 'bg-[#D97706]', label: 'WARNING'
  }
};

export default function StatusTag({ status, customLabel, size = 'sm' }) {
  const config = STATUS_CONFIGS[status] || {
    bg: 'bg-[#F8FAFC]', text: 'text-[#334155]', border: 'border-[#E2E8F0]', dot: 'bg-[#64748B]', label: status || 'UNKNOWN'
  };

  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`rounded-[4px] font-mono font-medium inline-flex items-center gap-1.5 border leading-none shadow-2xs ${config.bg} ${config.text} ${config.border} ${pad}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      <span>{customLabel || config.label}</span>
    </span>
  );
}
