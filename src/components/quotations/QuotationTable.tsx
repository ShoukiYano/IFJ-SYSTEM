"use client";

import React from "react";
import { format } from "date-fns";
import { FileText, Edit, Trash2, ArrowRightLeft, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Quotation {
  id: string;
  quotationNumber: string;
  client: { name: string };
  issueDate: string;
  totalAmount: number;
  status: string;
  templateType?: string;
  invoiceId?: string;
}

const QuotationTable = ({ 
  quotations, 
  onEdit, 
  onConvert,
  selectedIds = [],
  onSelectionChange
}: { 
  quotations: Quotation[], 
  onEdit: (id: string) => void, 
  onConvert: (id: string) => void,
  selectedIds?: string[],
  onSelectionChange?: (ids: string[]) => void
}) => {
  const toggleAll = () => {
    if (selectedIds.length === quotations.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(quotations.map(q => q.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-slate-100 text-slate-600";
      case "SENT": return "bg-blue-100 text-blue-600";
      case "ACCEPTED": return "bg-emerald-100 text-emerald-600";
      case "INVOICED": return "bg-purple-100 text-purple-600";
      case "REJECTED": return "bg-rose-100 text-rose-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT": return "下書き";
      case "SENT": return "送付済み";
      case "ACCEPTED": return "成約";
      case "INVOICED": return "請求済み";
      case "REJECTED": return "失注";
      default: return status;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-slate-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <th className="pl-6 pr-4 py-4 w-10">
              <input 
                type="checkbox" 
                checked={quotations.length > 0 && selectedIds.length === quotations.length}
                onChange={toggleAll}
                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-4 py-4">見積番号</th>
            <th className="px-6 py-4">取引先</th>
            <th className="px-6 py-4">発行日</th>
            <th className="px-6 py-4 text-right">見積金額 (税込)</th>
            <th className="px-6 py-4 text-center">ステータス</th>
            <th className="px-6 py-4 text-center">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {quotations.map((q: Quotation) => (
            <tr key={q.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(q.id) ? 'bg-blue-50/50' : ''}`}>
              <td className="pl-6 pr-4 py-4">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(q.id)}
                  onChange={() => toggleOne(q.id)}
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="px-4 py-4 font-mono text-sm font-bold text-blue-600">
                <a href={`/quotations/${q.id}`} className="flex items-center gap-2 hover:underline">
                  {q.quotationNumber}
                  {q.templateType === 'SES' && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-bold uppercase tracking-widest">SES</span>
                  )}
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-700">{q.client.name}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(q.issueDate), "yyyy/MM/dd")}</td>
              <td className="px-6 py-4 text-sm text-right font-bold tabular-nums text-slate-900">{formatCurrency(Number(q.totalAmount))}</td>
              <td className="px-6 py-4 text-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(q.status)}`}>
                  {getStatusLabel(q.status)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <a href={`/quotations/${q.id}/edit`} className="p-1 hover:text-blue-600 transition-colors" title="編集">
                    <Edit size={18} />
                  </a>
                  {q.status !== "INVOICED" && (
                    <button onClick={() => onConvert(q.id)} className="p-1 hover:text-purple-600 transition-colors" title="請求書へ変換">
                      <ArrowRightLeft size={18} />
                    </button>
                  )}
                  {q.invoiceId && (
                    <a href={`/invoices/${q.invoiceId}`} className="p-1 hover:text-purple-600 transition-colors" title="関連する請求書">
                      <FileText size={18} />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuotationTable;
