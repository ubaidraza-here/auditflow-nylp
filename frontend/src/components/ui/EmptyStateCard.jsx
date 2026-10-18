import React from 'react';
import { FileQuestion } from 'lucide-react';

export default function EmptyStateCard({
  icon: Icon = FileQuestion,
  title = 'No records found',
  description = 'Try adjusting your filters or upload a new invoice to audit.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-slate-200">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
