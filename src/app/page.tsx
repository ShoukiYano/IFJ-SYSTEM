"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, FileText, TrendingUp, Settings, Calendar, AlertTriangle, ChevronRight, Search } from "lucide-react";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { BulkZipDownload } from "@/components/invoices/BulkZipDownload";
import { formatCurrency } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    count: 0,
    pending: 0,
  });

  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // 絞り込みフィルタ
  const [filterMonth, setFilterMonth] = useState("");
  const [filterClientId, setFilterClientId] = useState("");

  const fetchInvoices = async (month: string, clientId: string) => {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (clientId) params.append("clientId", clientId);
    const res = await fetch(`/api/invoices?${params.toString()}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setInvoices(data.slice(0, 10));
      const total = data.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
      setStats({
        totalAmount: total,
        count: data.length,
        pending: data.filter(inv => inv.status !== 'PAID').length,
      });
    } else {
      setInvoices([]);
    }
  };

  useEffect(() => {
    // 初回: フィルタなしで取得
    const fetchAll = async () => {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setInvoices(data.slice(0, 10));
        const total = data.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
        setStats({
          totalAmount: total,
          count: data.length,
          pending: data.filter(inv => inv.status !== 'PAID').length,
        });
      } else {
        setInvoices([]);
        setStats({ totalAmount: 0, count: 0, pending: 0 });
      }
    };

    // 売上統計取得
    const fetchStats = async () => {
      const res = await fetch("/api/stats/sales");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSalesData(data);
      }
    };

    // 契約終了間近のエンジニア取得
    const fetchContracts = async () => {
      try {
        const res = await fetch("/api/stats/contracts");
        const data = await res.json();
        if (Array.isArray(data)) {
          setExpiringContracts(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // クライアント一覧取得
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (Array.isArray(data)) setClients(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAll();
    fetchStats();
    fetchContracts();
    fetchClients();
  }, []);

  // フィルタ変更時に再取得
  useEffect(() => {
    if (filterMonth || filterClientId) {
      setSelectedIds([]);
      fetchInvoices(filterMonth, filterClientId);
    }
  }, [filterMonth, filterClientId]);

  const handleBulkGenerate = async () => {
    const targetMonth = prompt("対象月を半角数字で入力してください (例: 2024-09)", new Date().toISOString().slice(0, 7));
    if (!targetMonth) return;

    if (!confirm(`${targetMonth}月分の請求書を一括作成します。よろしいですか？\n※前月のデータをコピーして新規下書きを作成します。`)) return;

    try {
      const res = await fetch("/api/invoices/bulk-generate", {
        method: "POST",
        body: JSON.stringify({ targetMonth }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("通信エラーが発生しました。");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">ダッシュボード</h2>
          <p className="text-slate-500">請求書管理システムの状態を確認します。</p>
        </div>
        <div className="flex gap-4">
          <BulkZipDownload yearMonth={filterMonth || new Date().toISOString().slice(0, 7)} selectedIds={selectedIds} />
          <button 
            onClick={handleBulkGenerate}
            className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 transition-all shadow-md"
          >
            <Calendar size={20} /> 月始一括作成
          </button>
          <a href="/invoices/new" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md">
            <Plus size={20} /> 新規作成
          </a>
        </div>
      </div>

      {/* 契約更新アラート */}
      {expiringContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">契約更新の確認（2ヶ月以内）</h3>
              <p className="text-amber-700 text-xs">以下のエンジニアの契約終了日が近づいています。更新の確認を行ってください。</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringContracts.map((contract: any) => (
              <div key={contract.id} className="bg-white p-4 rounded-xl border border-amber-100 flex justify-between items-center group hover:border-amber-300 transition-all">
                <div>
                  <div className="font-bold text-slate-800">{contract.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>{contract.client?.name}</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">終了日: {new Date(contract.contractEndDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <a 
                  href="/clients" 
                  className="p-2 text-amber-400 group-hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                >
                  <ChevronRight size={18} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stats Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Key Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between mb-4">
              <span className="text-slate-500 text-sm font-bold uppercase">総売上額 (累計)</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
            </div>
            <div className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalAmount)}</div>
            <div className="mt-2 text-emerald-500 text-sm font-medium flex items-center gap-1">
              <span>先月比 +12%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between mb-4">
              <span className="text-slate-500 text-sm font-bold uppercase">発行済み請求書</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
            </div>
            <div className="text-3xl font-black text-slate-900">{stats.count} <span className="text-lg font-bold">件</span></div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl shadow-slate-200">
            <div className="flex justify-between mb-4 text-slate-400">
              <span className="text-sm font-bold uppercase">未入金・保留</span>
              <div className="size-2 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-3xl font-black">{stats.pending} <span className="text-lg font-bold">件</span></div>
            <p className="mt-4 text-slate-400 text-sm">早急な確認を推奨します。</p>
          </div>
        </div>

        {/* Right: Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" /> 売上推移
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <div className="size-2 bg-blue-500 rounded-full"></div> 売上高
              </div>
            </div>
          </div>
          <div className="h-[280px] min-h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => `¥${(val / 10000).toFixed(0)}万`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [`${Number(val || 0).toLocaleString()}円`, "売上"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800">最近の請求書</h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* 発行年月フィルタ */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">発行年月</label>
              <input
                type="month"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {filterMonth && (
                <button onClick={() => setFilterMonth("")} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
              )}
            </div>
            {/* 請求先フィルタ */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">請求先</label>
              <select
                value={filterClientId}
                onChange={e => setFilterClientId(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">すべて</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <a href="/invoices" className="text-blue-600 text-sm font-bold hover:underline whitespace-nowrap">すべて見る</a>
          </div>
        </div>
        {invoices.length > 0 ? (
          <InvoiceTable 
            invoices={invoices} 
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={(id: string) => window.location.href = `/invoices/${id}`}
            onPrint={(invoice: any) => window.location.href = `/invoices/${invoice.id}`}
            onDuplicate={(id: string) => {}}
          />
        ) : (
          <div className="p-12 border border-dashed border-slate-300 rounded-xl text-center">
            <p className="text-slate-400">請求書がまだありません。新規作成から始めてください。</p>
          </div>
        )}
      </div>
    </div>
  );
}

