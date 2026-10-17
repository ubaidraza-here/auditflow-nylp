import React from 'react';
import { ChevronRight, FileText } from 'lucide-react';
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
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#64748B] group-hover:text-[#0A2540] flex-shrink-0" />
          <div>
            <div className="font-mono font-semibold text-xs text-[#0A2540]">
              {invoice.invoice_number}
            </div>
            <div className="text-[11px] text-[#64748B] truncate max-w-[150px]">
              {invoice.vendor_name}
            </div>
          </div>
        </div>
      </td>

      {/* PO Reference */}
      <td className="py-3 px-4">
        <div className="font-mono text-xs text-[#0A2540] font-medium">
          {invoice.po_reference || 'NO PO REF'}
        </div>
        <div className="text-[10px] font-mono text-[#94A3B8]">
          {invoice.vendor_ntn || 'NTN-PENDING'}
        </div>
      </td>

      {/* Date */}
      <td className="py-3 px-4 font-mono text-xs text-[#64748B]">
        {invoice.invoice_date}
      </td>

      {/* Billed Amount */}
      <td className="py-3 px-4 text-right">
        <TabularCurrency amount={invoice.grand_total} className="text-xs font-semibold" />
      </td>

      {/* PO Baseline Amount */}
      <td className="py-3 px-4 text-right">
        <TabularCurrency amount={invoice.po_baseline_grand_total || invoice.grand_total} className="text-xs text-[#64748B]" />
      </td>

      {/* Variance */}
      <td className="py-3 px-4 text-right">
        <TabularCurrency
          amount={invoice.total_variance_amount || 0}
          isDelta={isOverrun}
          className={`text-xs ${isOverrun ? 'font-bold' : 'text-[#64748B]'}`}
        />
      </td>

      {/* Audit Status Tag */}
      <td className="py-3 px-4">
        <StatusTag status={invoice.status} />
      </td>

      {/* Review CTA */}
      <td className="py-3 px-4 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectInvoice(invoice.id);
          }}
          className="text-xs font-semibold text-[#0A2540] hover:text-[#1E3A5F] group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Review Case</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}
