"use client";

import React from "react";
import { format } from "date-fns";
import { Edit, FileText, Copy, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  subject: string | null;
  totalAmount: number;
  status: string;
  templateType: string;
  client: {
    name: string;
  };
}

export const InvoiceTable = ({ 
  invoices, 
  onEdit, 
  onPrint, 
  onDuplicate,
  selectedIds = [],
  onSelectionChange
}: { 
  invoices: Invoice[], 
  onEdit: (id: string) => void, 
  onPrint: (inv: any) => void, 
  onDuplicate: (id: string) => void,
  selectedIds?: string[],
  onSelectionChange?: (ids: string[]) => void
}) => {
  const toggleAll = () => {
    if (selectedIds.length === invoices.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(invoices.map(inv => inv.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-slate-800">
      {/* Desktop / Tablet View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="pl-6 pr-4 py-4 w-10">
                <input 
                  type="checkbox" 
                  checked={invoices.length > 0 && selectedIds.length === invoices.length}
                  onChange={toggleAll}
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-4 text-xs font-bold text-slate-600 uppercase">請求書番号</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase hidden lg:table-cell">発行日</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase text-right">合計(税込)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">請求先</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase hidden sm:table-cell">ステータス</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((invoice: Invoice) => (
              <tr key={invoice.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(invoice.id) ? 'bg-blue-50/50' : ''}`}>
                <td className="pl-6 pr-4 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(invoice.id)}
                    onChange={() => toggleOne(invoice.id)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4 text-sm font-medium">
                  <div className="flex flex-col">
                    <span>{invoice.invoiceNumber}</span>
                    {invoice.templateType === 'SES' && (
                      <span className="w-fit mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-bold uppercase tracking-wider">SES</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">
                  {format(new Date(invoice.issueDate), "yyyy/MM/dd")}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-right tabular-nums">
                  {formatCurrency(Number(invoice.totalAmount))}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{invoice.client.name}</td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                    invoice.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {invoice.status === 'PAID' ? '支払済' :
                     invoice.status === 'ISSUED' ? '発行済' : '下書き'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <a href={`/invoices/${invoice.id}/edit`} title="編集" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all">
                      <Edit size={18} />
                    </a>
                    <button onClick={() => onPrint(invoice)} title="PDF表示" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-all">
                      <FileText size={18} />
                    </button>
                    <button onClick={() => onDuplicate(invoice.id)} title="複製" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all">
                      <Copy size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {invoices.map((invoice: Invoice) => (
          <div key={invoice.id} className="p-4 space-y-3 bg-white active:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(invoice.id)}
                  onChange={() => toggleOne(invoice.id)}
                  className="size-4 rounded border-slate-300 text-blue-600"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</div>
                  <div className="text-xs text-slate-500">{invoice.client.name}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                invoice.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {invoice.status === 'PAID' ? '支払済' :
                 invoice.status === 'ISSUED' ? '発行済' : '下書き'}
              </span>
            </div>
            
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase font-bold">{format(new Date(invoice.issueDate), "yyyy/MM/dd")}</div>
              <div className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(Number(invoice.totalAmount))}</div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <a href={`/invoices/${invoice.id}/edit`} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all">
                <Edit size={18} />
              </a>
              <button onClick={() => onPrint(invoice)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all">
                <FileText size={18} />
              </button>
              <button onClick={() => onDuplicate(invoice.id)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                <Copy size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
