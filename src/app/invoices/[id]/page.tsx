"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Printer, Download, Eye, Loader2, Edit, Copy, FileText, Mail } from "lucide-react";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils";
import { SendInvoiceEmailModal } from "@/components/invoices/SendInvoiceEmailModal";

// PDFコンポーネントを動的にインポート（SSR無効）
const PDFActionButtons = dynamic(
  () => import("@/components/pdf/PDFClientWrapper"),
  { ssr: false, loading: () => <div className="px-4 py-2 bg-slate-100 rounded-lg text-slate-400 font-bold border border-slate-200">読み込み中...</div> }
);

const PDFPreviewSection = dynamic(
  () => import("@/components/pdf/PDFClientWrapper").then(mod => mod.PDFPreviewSection),
  { ssr: false }
);

export default function InvoiceDetailPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Invoice not found");
        return res.json();
      })
      .then(setData)
      .catch(err => {
        console.error("Invoice fetch error:", err);
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

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    const res = await fetch(`/api/invoices/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(updated);
    }
    setUpdating(false);
  };

  const handleDuplicate = async () => {
    if (!confirm("この請求書を複製して新しい下書きを作成しますか？")) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const duplicated = await res.json();
        alert("請求書を複製しました。編集画面へ移動します。");
        window.location.href = `/invoices/${duplicated.id}/edit`;
      } else {
        const err = await res.json();
        alert(`複製に失敗しました: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました。");
    } finally {
      setUpdating(false);
    }
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
        <a href="/" className="text-blue-600 hover:underline">ダッシュボードへ戻る</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <a href="/" className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0">
                <ChevronLeft size={24} />
              </a>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 truncate">{data.invoiceNumber}</h1>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <a
                href={`/invoices/${params.id}/edit`}
                className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <Edit size={20} />
              </a>
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Mail size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors text-sm"
            >
              <Eye size={18} /> {showPreview ? "閉じる" : "プレビュー"}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <a
                href={`/invoices/${params.id}/edit`}
                className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-100 transition-colors text-sm"
              >
                <Edit size={18} /> 編集
              </a>

              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 text-sm"
              >
                <Mail size={18} /> メール送信
              </button>
            </div>

            <button
              onClick={handleDuplicate}
              disabled={updating}
              className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors text-sm"
            >
              <Copy size={18} /> 複製
            </button>

            <PDFActionButtons invoice={data} company={company} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-500 uppercase mb-6 tracking-widest border-b pb-2">請求内容サマリー</h2>
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <label className="text-xs text-slate-400 block">請求先</label>
                  <span className="font-bold text-lg">{data.client.name} {data.client.honorific}</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block">請求金額 (税込)</label>
                  <span className="font-bold text-2xl text-blue-600">{formatCurrency(Number(data.totalAmount))}</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block">発行日</label>
                  <span className="font-medium text-slate-700">{data.issueDate.split('T')[0]}</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block">支払期限</label>
                  <span className="font-medium text-slate-700">{data.dueDate ? data.dueDate.split('T')[0] : "指定なし"}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <h2 className="text-xs font-bold text-slate-500 uppercase p-6 border-b tracking-widest bg-slate-50/50">明細項目</h2>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      {data.templateType === "SES" ? (
                        <>
                          <th className="px-6 py-3 font-black">年月</th>
                          <th className="px-6 py-3 font-black">該当者</th>
                          <th className="px-6 py-3 font-black">内容 / 項目</th>
                        </>
                      ) : (
                        <th className="px-6 py-3 font-black">内容 / 項目</th>
                      )}
                      <th className="px-6 py-3 text-center font-black">数量 / 時間</th>
                      <th className="px-6 py-3 text-right font-black">単価</th>
                      <th className="px-6 py-3 text-right font-black">金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        {data.templateType === "SES" ? (
                          <>
                            <td className="px-6 py-4 text-sm text-slate-600">{item.serviceMonth || "-"}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 font-bold">{item.personName || "-"}</td>
                            <td className="px-6 py-4 text-sm">
                              <div className="text-slate-900">{item.description}</div>
                              {(Number(item.overtimeAmount) > 0 || Number(item.deductionAmount) > 0) && (
                                <div className="text-[10px] mt-1 space-x-2">
                                  {Number(item.overtimeAmount) > 0 && <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">超過: +{formatCurrency(Number(item.overtimeAmount))}</span>}
                                  {Number(item.deductionAmount) > 0 && <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">控除: -{formatCurrency(Number(item.deductionAmount))}</span>}
                                </div>
                              )}
                            </td>
                          </>
                        ) : (
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.description}</td>
                        )}
                        <td className="px-6 py-4 text-sm text-center text-slate-600 font-mono">
                          {Number(item.quantity)}
                          <span className="text-[10px] ml-0.5 text-slate-400">{item.unit || ""}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono italic">{formatCurrency(Number(item.unitPrice))}</td>
                        <td className="px-6 py-4 text-sm text-right font-black text-slate-900 tabular-nums">{formatCurrency(Number(item.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {data.items.map((item: any, idx: number) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        {data.templateType === "SES" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{item.serviceMonth}</span>
                            <span className="text-xs font-bold text-slate-900 truncate">{item.personName}</span>
                          </div>
                        )}
                        <div className="text-sm font-bold text-slate-700 leading-tight">{item.description}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(Number(item.amount))}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatCurrency(Number(item.unitPrice))} × {item.quantity}{item.unit}
                        </div>
                      </div>
                    </div>
                    
                    {(Number(item.overtimeAmount) > 0 || Number(item.deductionAmount) > 0) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Number(item.overtimeAmount) > 0 && (
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>超過</span>
                            <span>+{formatCurrency(Number(item.overtimeAmount))}</span>
                          </div>
                        )}
                        {Number(item.deductionAmount) > 0 && (
                          <div className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>控除</span>
                            <span>−{formatCurrency(Number(item.deductionAmount))}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">ステータス管理</h2>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg flex items-center justify-between ${data.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                  <span className="font-bold">{data.status === 'PAID' ? '入金済み' : '請求済み (未入金)'}</span>
                  <div className={`size-3 rounded-full ${data.status === 'PAID' ? 'bg-emerald-500' : 'bg-blue-500'} ${updating ? 'animate-ping' : ''}`} />
                </div>
                {data.status !== 'PAID' ? (
                  <button
                    onClick={() => handleStatusUpdate('PAID')}
                    disabled={updating}
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {updating && <Loader2 size={16} className="animate-spin" />}
                    入金済みにする
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusUpdate('ISSUED')}
                    disabled={updating}
                    className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                  >
                    {updating && <Loader2 size={16} className="animate-spin" />}
                    未入金に戻す
                  </button>
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

        <PDFPreviewSection invoice={data} company={company} showPreview={showPreview} />

        <SendInvoiceEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          invoice={data}
        />
      </div>
    </div>
  );
}
