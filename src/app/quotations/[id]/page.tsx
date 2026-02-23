"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Download, Eye, Loader2, ArrowRightLeft, Edit } from "lucide-react";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils";

// PDFコンポーネントを動的にインポート（SSR無効）
const QuotationPDFDownload = dynamic(
  () => import("@/components/pdf/QuotationPDFWrapper"),
  { ssr: false, loading: () => <div className="px-4 py-2 bg-slate-100 rounded-lg text-slate-400 font-bold border border-slate-200">読み込み中...</div> }
);

const QuotationPDFPreview = dynamic(
  () => import("@/components/pdf/QuotationPDFWrapper").then(mod => mod.QuotationPDFPreview),
  { ssr: false }
);

export default function QuotationDetailPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/quotations/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Quotation not found");
        return res.json();
      })
      .then(setData)
      .catch(err => {
        console.error("Quotation fetch error:", err);
        setData({ error: true });
      });
    
    fetch("/api/company")
      .then(res => res.json())
      .then(setCompany)
      .catch(err => {
        console.error("Company fetch error:", err);
        setCompany({ error: true });
      });
  }, [params.id]);

  const handleConvert = async () => {
    if (!confirm("この見積書を請求書に変換しますか？")) return;
    setUpdating(true);
    const res = await fetch(`/api/quotations/${params.id}/convert`, { method: "POST" });
    if (res.ok) {
      const invoice = await res.json();
      alert("請求書を作成しました。");
      window.location.href = `/invoices/${invoice.id}`;
    } else {
      alert("変換に失敗しました。");
    }
    setUpdating(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    const res = await fetch(`/api/quotations/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(updated);
    }
    setUpdating(false);
  };

  if (!data || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (data.error || company.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <p className="font-bold text-xl">データの取得に失敗しました。</p>
        <a href="/quotations" className="text-blue-600 hover:underline">見積書一覧へ戻る</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a href="/quotations" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </a>
            <h1 className="text-3xl font-black text-slate-900">{data.quotationNumber} の詳細</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Eye size={20} /> {showPreview ? "詳細を閉じる" : "プレビュー"}
            </button>
            
            {data.status !== "INVOICED" && (
              <button 
                onClick={handleConvert}
                disabled={updating}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors"
              >
                <ArrowRightLeft size={20} /> 請求書に変換
              </button>
            )}

            <a 
              href={`/quotations/${params.id}/edit`}
              className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-100 transition-colors"
            >
              <Edit size={20} /> 編集
            </a>

            <QuotationPDFDownload quotation={data} company={company} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-500 uppercase mb-6 tracking-widest border-b pb-2">見積内容サマリー</h2>
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <label className="text-xs text-slate-400 block">見積先</label>
                  <span className="font-bold text-lg">{data.client.name} {data.client.honorific}</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block">見積金額 (税込)</label>
                  <span className="font-bold text-2xl text-blue-600 font-mono">{formatCurrency(Number(data.totalAmount))}</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block">発行日</label>
                  <span className="font-medium text-slate-700">{data.issueDate.split('T')[0]}</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block">有効期限</label>
                  <span className="font-medium text-slate-700">{data.expiryDate ? data.expiryDate.split('T')[0] : "指定なし"}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                    {data.templateType === "SES" ? (
                      <>
                        <th className="px-6 py-4">年月</th>
                        <th className="px-6 py-4">該当者</th>
                        <th className="px-6 py-4">内容 / 項目</th>
                      </>
                    ) : (
                      <th className="px-6 py-4">内容 / 項目</th>
                    )}
                    <th className="px-6 py-4 text-center">数量 / 時間</th>
                    <th className="px-6 py-4 text-right">単価</th>
                    <th className="px-6 py-4 text-right">金額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.items.map((item: any) => (
                    <tr key={item.id}>
                      {data.templateType === "SES" ? (
                        <>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.serviceMonth || "-"}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.personName || "-"}</td>
                        </>
                      ) : null}
                      <td className="px-6 py-4 text-sm font-medium">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-center text-slate-600">
                        {Number(item.quantity)}
                        <span className="text-[10px] ml-0.5">{item.unit || ""}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold tabular-nums">{formatCurrency(Number(item.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">ステータス管理</h2>
              <div className="space-y-3">
                <select 
                  value={data.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={updating}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="DRAFT">下書き</option>
                  <option value="SENT">送付済み</option>
                  <option value="ACCEPTED">成約</option>
                  <option value="REJECTED">失注</option>
                  <option value="INVOICED" disabled>請求済み</option>
                </select>
                {data.status === 'INVOICED' && (
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">この見積書は既に請求書に変換されています</p>
                )}
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">備考</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {data.notes || "備考はありません。"}
              </p>
            </section>
          </div>
        </div>

        <QuotationPDFPreview quotation={data} company={company} showPreview={showPreview} />
      </div>
    </div>
  );
}
