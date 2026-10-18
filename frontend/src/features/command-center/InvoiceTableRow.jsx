import React from 'react';
import { ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import StatusTag from '../../components/common/StatusTag';
import TabularCurrency from '../../components/common/TabularCurrency';

export default function InvoiceTableRow({ invoice, onSelectInvoice }) {
  const isOverrun = invoice.total_variance_amount > 0.005;

  return (
    <tr
      onClick={() => onSelectInvoice(invoice.id)}
      className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
    >
      {/* Invoice & Vendor */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-[#64748B] group-hover:text-[#0A2540] flex-shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-[#0A2540]">
                {invoice.invoice_number}
              </span>
              <span className="text-[10px] font-mono text-[#065F46] bg-[#ECFDF5] px-1 py-0.2 rounded border border-[#A7F3D0]">
                Gemini 3.5 Vision
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] font-medium truncate max-w-[160px]">
              {invoice.vendor_name}
            </div>
          </div>
        </div>
      </td>

      {/* PO Reference */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="font-mono text-xs text-[#0A2540] font-semibold">
          {invoice.po_reference || 'NO PO REF'}
        </div>
        <div className="text-[10px] font-mono text-[#94A3B8]">
          {invoice.vendor_ntn || 'NTN-PENDING'}
        </div>
      </td>

      {/* Date */}
      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-[#64748B]">
        {invoice.invoice_date}
      </td>

      {/* Billed Amount */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <TabularCurrency amount={invoice.grand_total} className="text-xs font-semibold text-[#0A2540]" />
      </td>

      {/* PO Baseline Amount */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <TabularCurrency amount={invoice.po_baseline_grand_total || invoice.grand_total} className="text-xs text-[#64748B]" />
      </td>

      {/* Variance */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <TabularCurrency
          amount={invoice.total_variance_amount || 0}
          isDelta={isOverrun}
          className={`text-xs ${isOverrun ? 'font-bold' : 'text-[#64748B]'}`}
        />
      </td>

      {/* Audit Status Tag */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <StatusTag status={invoice.status} />
      </td>

      {/* Tactile Review CTA Button */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectInvoice(invoice.id);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white text-[#0A2540] border border-[#CBD5E1] hover:bg-[#0A2540] hover:text-white hover:border-[#0A2540] shadow-2xs transition-all cursor-pointer whitespace-nowrap group-hover:border-[#0A2540]"
        >
          <span>Review Case</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}
