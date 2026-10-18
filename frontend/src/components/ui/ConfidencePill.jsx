import React from 'react';
import { Sparkles } from 'lucide-react';

export default function ConfidencePill({ score = 0, showIcon = true }) {
  // Normalize score whether passed as 0.96 or 96
  const normalized = score > 1 ? score : Math.round(score * 100);

  let toneClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeLabel = 'High';

  if (normalized < 70) {
    toneClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeLabel = 'Low';
  } else if (normalized < 85) {
    toneClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    badgeLabel = 'Review';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-mono font-medium tabular-nums ${toneClasses}`}
      title={`AI Multimodal Extraction Confidence: ${normalized}% (${badgeLabel})`}
    >
      {showIcon && <Sparkles className="w-3 h-3 shrink-0 opacity-75" />}
      <span>{normalized}%</span>
    </div>
  );
}
