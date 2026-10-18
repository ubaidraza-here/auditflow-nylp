import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileX2,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';

const STATUS_CONFIG = {
  PROCESSING: {
    label: 'Processing',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500 animate-pulse',
    icon: Clock,
  },
  VERIFIED_MATCH: {
    label: 'Verified Match',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  EXCEPTION_FLAGGED: {
    label: 'Exception Flagged',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    icon: AlertTriangle,
  },
  EXTRACTION_FAILED: {
    label: 'Extraction Failed',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-500',
    icon: FileX2,
  },
  APPROVED_CLEAN: {
    label: 'Approved Clean',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-600',
    icon: CheckCheck,
  },
  APPROVED_WITH_OVERRIDE: {
    label: 'Approved (Override)',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500',
    icon: ShieldCheck,
  },
  REJECTED_DISPUTED: {
    label: 'Rejected (Disputed)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
    dotClass: 'bg-rose-600',
    icon: AlertOctagon,
  },
};

export default function StatusBadge({ status, size = 'sm', showIcon = true }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
    icon: Clock,
  };

  const IconComponent = config.icon;
  const sizeClasses = size === 'xs'
    ? 'text-xs px-2 py-0.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-xs transition-colors duration-150 ${config.badgeClass} ${sizeClasses}`}
      title={`State: ${status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate">{config.label}</span>
    </span>
  );
}
