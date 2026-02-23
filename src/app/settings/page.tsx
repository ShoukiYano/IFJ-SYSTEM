"use client";

import React, { useState, useEffect } from "react";
import { Save, Building2, Landmark, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/company")
      .then(res => res.json())
      .then(data => setFormData(data || {}));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    
    const res = await fetch("/api/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setMessage("設定を保存しました。");
      setTimeout(() => setMessage(""), 3000);
    } else {
      const errorData = await res.json();
      alert(`保存に失敗しました: ${errorData.error ? JSON.stringify(errorData.error) : "不明なエラー"}`);
    }
    setSaving(false);
  };

  if (!formData) return <div className="p-8">読み込み中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">システム設定</h1>
        <p className="text-slate-500">自社情報や振込先、請求書のデフォルト設定を管理します。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 自社基本情報 */}
        <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
            <Building2 className="text-blue-600" size={20} /> 自社基本情報
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">会社名 / 屋号</label>
              <input 
                type="text" required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.name || ""}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            {/* 印影アップロード */}
            <div className="md:col-span-2 space-y-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <label className="text-xs font-bold text-slate-700 uppercase block">会社印 (角印) - PDF用</label>
              <div className="flex items-center gap-6">
                <div className="size-24 border bg-white rounded flex items-center justify-center overflow-hidden">
                  {formData.stampUrl ? (
                    <img src={formData.stampUrl} alt="Stamp Preview" className="size-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-400">未登録</span>
                  )}
                </div>
                <div className="space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, stampUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-[10px] text-slate-400">背景が透明なPNG画像を推奨します (サイズ: 100x100px 程度)</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">郵便番号</label>
              <input 
                type="text" required placeholder="100-0001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.zipCode || ""}
                onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">住所</label>
              <input 
                type="text" required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.address || ""}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">登録番号 (インボイス)</label>
              <input 
                type="text" placeholder="T1234567890123"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.registrationNumber || ""}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">電話番号</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.tel || ""}
                onChange={e => setFormData({ ...formData, tel: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* 振込先情報 */}
        <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
            <Landmark className="text-blue-600" size={20} /> 振込先情報 (請求書に記載されます)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">銀行名</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.bankName || ""}
                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">支店名</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.bankBranch || ""}
                onChange={e => setFormData({ ...formData, bankBranch: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">口座種別</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.bankAccountType || "普通"}
                onChange={e => setFormData({ ...formData, bankAccountType: e.target.value })}
              >
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">口座番号</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.bankAccountNumber || ""}
                onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">口座名義 (カナ)</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                value={formData.bankAccountName || ""}
                onChange={e => setFormData({ ...formData, bankAccountName: e.target.value })}
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            {message && (
              <>
                <CheckCircle2 size={20} />
                <span>{message}</span>
              </>
            )}
          </div>
          <button 
            type="submit" disabled={saving}
            className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save size={20} /> {saving ? "保存中..." : "設定を保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
