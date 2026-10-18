import React from 'react';

export default function QuickAuditItem({ item, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
        isSelected ? 'bg-[#0A2540] text-white' : 'hover:bg-[#F8FAFC] text-[#0A2540]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`material-symbols-outlined text-[18px] shrink-0 ${
            isSelected ? 'text-white' : 'text-[#64748B]'
          }`}
        >
          {item.icon}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-medium truncate text-xs">{item.title}</span>
          {item.subtitle && (
            <span
              className={`text-[10px] font-mono truncate ${
                isSelected ? 'text-slate-300' : 'text-[#64748B]'
              }`}
            >
              {item.subtitle}
            </span>
          )}
        </div>
      </div>
      <span
        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
          isSelected ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#64748B]'
        }`}
      >
        {item.type}
      </span>
    </button>
  );
}
