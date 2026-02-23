"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, FileText, Loader2, Filter } from "lucide-react";
import QuotationTable from "@/components/quotations/QuotationTable";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    setLoading(true);
    const res = await fetch("/api/quotations");
    const data = await res.json();
    setQuotations(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleConvert = async (id: string) => {
    if (!confirm("この見積書を請求書に変換しますか？")) return;
    
    const res = await fetch(`/api/quotations/${id}/convert`, { method: "POST" });
    if (res.ok) {
      const invoice = await res.json();
      alert("請求書を作成しました。");
      window.location.href = `/invoices/${invoice.id}`;
    } else {
      alert("変換に失敗しました。");
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    
    const res = await fetch("/api/quotations/bulk-update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status }),
    });

    if (res.ok) {
      setSelectedIds([]);
      fetchQuotations();
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="text-blue-600" size={36} />
            見積書管理
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">作成した見積書の管理と請求書への変換が可能です。</p>
        </div>
        <a 
          href="/quotations/new" 
          className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
        >
          <Plus size={24} strokeWidth={3} />
          新規作成
        </a>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="見積番号や取引先で検索..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors ring-1 ring-slate-200">
            <Filter size={20} />
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto p-2 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-bold text-blue-700 px-2">{selectedIds.length}件を選択中</span>
            <div className="h-4 w-px bg-blue-200 mx-1"></div>
            <button 
              onClick={() => handleBulkUpdate('SENT')}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              送付済みにする
            </button>
            <button 
              onClick={() => handleBulkUpdate('ACCEPTED')}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              成約にする
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <QuotationTable 
          quotations={quotations} 
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={(id: string) => window.location.href = `/quotations/${id}/edit`}
          onConvert={handleConvert}
        />
      )}
    </div>
  );
}
