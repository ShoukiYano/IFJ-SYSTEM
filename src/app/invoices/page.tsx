"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, CheckCircle, Clock as ClockIcon, Download, ListChecks } from "lucide-react";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import BatchGenerateModal from "@/components/invoices/BatchGenerateModal";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    keyword: "",
    minDate: "",
    maxDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.keyword) params.append("keyword", filters.keyword);
    if (filters.minDate) params.append("minDate", filters.minDate);
    if (filters.maxDate) params.append("maxDate", filters.maxDate);
    if (filters.minAmount) params.append("minAmount", filters.minAmount);
    if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);

    const res = await fetch(`/api/invoices?${params.toString()}`);
    const data = await res.json();
    setInvoices(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;

    const res = await fetch("/api/invoices/bulk-update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status }),
    });

    if (res.ok) {
      setSelectedIds([]);
      fetchInvoices();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">請求書一覧</h2>
          <p className="text-slate-500 text-sm">発行済みの請求書を管理します。</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex-1 sm:flex-none justify-center bg-white text-blue-600 border border-blue-200 px-4 sm:px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm text-sm"
          >
            <ListChecks size={18} /> 一括作成
          </button>
          <a href="/invoices/new" className="flex-1 sm:flex-none justify-center bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md text-sm">
            <Plus size={18} /> 新規作成
          </a>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="番号・宛先で検索..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                value={filters.keyword}
                onChange={e => setFilters({ ...filters, keyword: e.target.value })}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => window.location.href = '/api/export/invoices'}
                className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Download size={16} /> CSV
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-colors ${showFilters ? "bg-blue-50 border-blue-200 text-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Filter size={16} /> フィルタ
              </button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto p-2 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
              <span className="text-xs font-bold text-blue-700 px-2">{selectedIds.length}件選択中</span>
              <div className="hidden sm:block h-4 w-px bg-blue-200 mx-1"></div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleBulkUpdate('PAID')}
                  className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-1"
                >
                  <CheckCircle size={14} /> 入金済
                </button>
                <button
                  onClick={() => handleBulkUpdate('ISSUED')}
                  className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <ClockIcon size={14} /> 発行済
                </button>
              </div>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">日付 (開始)</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                value={filters.minDate}
                onChange={e => setFilters({ ...filters, minDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">日付 (終了)</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                value={filters.maxDate}
                onChange={e => setFilters({ ...filters, maxDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">金額 (最小)</label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                value={filters.minAmount}
                onChange={e => setFilters({ ...filters, minAmount: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">金額 (最大)</label>
              <input
                type="number"
                placeholder="1,000,000"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                value={filters.maxAmount}
                onChange={e => setFilters({ ...filters, maxAmount: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-400">読み込み中...</div>
      ) : (
        <InvoiceTable
          invoices={invoices}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={(id: string) => window.location.href = `/invoices/${id}/edit`}
          onPrint={(inv: any) => window.location.href = `/invoices/${inv.id}`}
          onDuplicate={(id: string) => {/* TODO */ }}
        />
      )}

      <BatchGenerateModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={fetchInvoices}
      />
    </div>
  );
}
