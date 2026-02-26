"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, CheckCircle, AlertCircle, Loader2, ListChecks } from "lucide-react";

interface BatchGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchGenerateModal({ isOpen, onClose, onSuccess }: BatchGenerateModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // 翌月のデフォルト設定
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setTargetDate(nextMonth.toISOString().substring(0, 7)); // YYYY-MM
      
      fetchTargets();
    }
  }, [isOpen]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients?recurringOnly=true");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!targetDate) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMonth: targetDate }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`${result.count}件の請求書下書きを生成しました。`);
        onSuccess();
        onClose();
      } else {
        const error = await res.json();
        alert(`生成に失敗しました: ${error.error}`);
      }
    } catch (err) {
      alert("通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="bg-blue-600 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
            <ListChecks size={32} />
          </div>
          <h2 className="text-2xl font-black italic tracking-tight">定型請求の一括生成</h2>
          <p className="text-blue-100 text-sm mt-2 font-medium opacity-90">
            定型請求対象の全取引先に対して、翌月分の下書きを自動生成します。
          </p>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* 年月選択 */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar size={14} className="text-blue-500" /> 対象年月を選択
            </label>
            <input 
              type="month" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
          </div>

          {/* 対象リスト */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">生成対象の取引先 ({clients.length}件)</label>
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : clients.length > 0 ? (
              <div className="grid gap-2 border border-slate-100 rounded-2xl overflow-hidden">
                {clients.map(client => (
                  <div key={client.id} className="flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-white transition-colors border-b border-slate-50 last:border-0 group">
                    <div className="p-2 bg-white text-emerald-500 rounded-xl shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <CheckCircle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm truncate">{client.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{client.department || "部署未設定"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertCircle className="text-amber-500 mt-0.5" size={20} />
                <div>
                  <div className="text-sm font-bold text-amber-800">対象の取引先が見つかりません</div>
                  <p className="text-xs text-amber-600 mt-1">取引先管理で「毎月の定型請求対象にする」にチェックを入れた取引先がここに表示されます。</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
          >
            キャンセル
          </button>
          <button 
            onClick={handleGenerate}
            disabled={clients.length === 0 || isSubmitting}
            className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            一括生成を実行する
          </button>
        </div>
      </div>
    </div>
  );
}
