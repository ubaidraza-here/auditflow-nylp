import React, { useState, useEffect } from 'react';
import { Download, ShoppingBag, CheckCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { exportPurchaseOrdersCsv } from '../utils/exportUtils';
import TabularCurrency from '../components/common/TabularCurrency';

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getPurchaseOrders().then(data => {
      setPos(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#E2E8F0] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0A2540] tracking-tight">
            ERP Purchase Order Registry (Authorized Baselines)
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Contracted commercial rates, quantities, and settlement banking coordinates
          </p>
        </div>
        <button
          onClick={() => exportPurchaseOrdersCsv(pos)}
          className="border border-[#CBD5E1] hover:border-[#0A2540] bg-white text-[#0A2540] text-xs font-semibold px-3 py-1.5 rounded-[4px] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Export All POs (CSV)</span>
        </button>
      </div>

      <div className="space-y-6">
        {pos.map((po) => (
          <div key={po.po_number} className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-xs overflow-hidden">
            {/* PO Card Header */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[4px] bg-[#0A2540] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                  PO
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0A2540]">{po.po_number}</span>
                    <span className="text-xs text-[#64748B]">({po.vendor_name})</span>
                    <span className="bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold">
                      CONTRACT ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-[#64748B]">
                    <span>NTN: {po.vendor_ntn}</span>
                    <span>•</span>
                    <span>IBAN: {po.vendor_iban}</span>
                    <span>•</span>
                    <span>Issued: {po.issue_date}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-[#64748B] uppercase">Authorized Limit</div>
                <div className="text-lg font-bold text-[#0A2540]">
                  <TabularCurrency amount={po.grand_total} />
                </div>
              </div>
            </div>

            {/* PO Line Items Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[920px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[11px] font-mono text-[#475569] uppercase font-semibold whitespace-nowrap">
                    <th className="py-2 px-4">Line Item ID</th>
                    <th className="py-2 px-4">Contracted Item Description</th>
                    <th className="py-2 px-4 text-right">Max Authorized Qty</th>
                    <th className="py-2 px-4 text-right">Contracted Unit Rate</th>
                    <th className="py-2 px-4 text-right">Authorized Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(po.lines || []).map((l) => (
                    <tr key={l.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#0A2540] font-semibold">{l.id}</td>
                      <td className="py-2.5 px-4 font-medium text-[#0A2540]">{l.description}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#475569]">{l.qty.toFixed(1)}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#0A2540]">${l.rate.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#0A2540] font-semibold">${l.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
