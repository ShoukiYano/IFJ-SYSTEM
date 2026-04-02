"use client";

import React, { useState, useEffect } from "react";
import { Save, Building2, Landmark, CheckCircle2, Mail, GitBranch, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SettingsPage() {
  const [formData, setFormData] = useState<any>(null);
  const [googleAccount, setGoogleAccount] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [newBranch, setNewBranch] = useState({ name: "", zipCode: "", address: "" });
  const [addingBranch, setAddingBranch] = useState(false);

  useEffect(() => {
    fetch("/api/company")
      .then(res => res.json())
      .then(data => setFormData(data || {}));

    fetch("/api/auth/google/status")
      .then(res => res.json())
      .then(data => setGoogleAccount(data.connected ? data : null));

    fetch("/api/branches")
      .then(res => res.json())
      .then(data => setBranches(Array.isArray(data) ? data : []));
  }, []);

  const fetchBranches = () =>
    fetch("/api/branches").then(r => r.json()).then(d => setBranches(Array.isArray(d) ? d : []));

  const handleAddBranch = async () => {
    if (!newBranch.name) return;
    setAddingBranch(true);
    await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newBranch, order: branches.length }),
    });
    setNewBranch({ name: "", zipCode: "", address: "" });
    await fetchBranches();
    setAddingBranch(false);
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("この支社を削除しますか？")) return;
    await fetch(`/api/branches/${id}`, { method: "DELETE" });
    await fetchBranches();
  };

  const handleUpdateBranch = async (branch: any) => {
    await fetch(`/api/branches/${branch.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branch),
    });
    await fetchBranches();
  };

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
        <div className="mt-4">
          <Link href="/settings/email-templates" className="text-blue-600 hover:underline flex items-center gap-2 font-bold p-3 bg-blue-50 rounded-xl border border-blue-100 w-fit">
            <Mail size={18} /> メールテンプレート設定はこちら
          </Link>
        </div>
      </div>

      {/* Google連携セクション */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${googleAccount ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">メール送信設定 (Gmail連携)</h2>
              {googleAccount ? (
                <p className="text-sm text-emerald-600 font-medium">連携済み: {googleAccount.email}</p>
              ) : (
                <p className="text-sm text-slate-500">Googleアカウントを連携すると、自身のGmailアドレスで請求書を送信できます。</p>
              )}
            </div>
          </div>
          {googleAccount ? (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Googleアカウントの連携を解除しますか？")) return;
                const res = await fetch("/api/auth/google/status", { method: "DELETE" });
                if (res.ok) setGoogleAccount(null);
              }}
              className="text-slate-400 hover:text-rose-600 text-sm font-bold transition-colors"
            >
              連携を解除する
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/auth/google/connect");
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  else alert("連携URLの取得に失敗しました");
                } catch (e) {
                  alert("通信エラーが発生しました");
                }
              }}
              className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
            >
              <Image 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='16' height='16'%3E%3Cpath fill='%23EA4335' d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'/%3E%3Cpath fill='%234285F4' d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'/%3E%3Cpath fill='%23FBBC05' d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z'/%3E%3Cpath fill='%2334A853' d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'/%3E%3Cpath fill='none' d='M0 0h48v48H0z'/%3E%3C/svg%3E" 
                alt="Google" 
                width={16} 
                height={16} 
                className="size-4" 
              />
              Google連携を開始する
            </button>
          )}
        </div>

        {/* CC設定の追加 */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 uppercase block mb-2">請求書メール送信時のデフォルトCC</label>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="text"
                placeholder="例）cc@example.com, manager@example.com"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                value={formData.defaultCc || ""}
                onChange={e => setFormData({ ...formData, defaultCc: e.target.value })}
              />
            </div>
            <p className="text-[10px] text-slate-400 flex-1 leading-tight">
              ここに設定したアドレスは、請求書送信画面のCC欄に初期値として自動設定されます。複数の場合はカンマ区切りで入力してください。
            </p>
          </div>
        </div>
      </section>

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
                    <Image src={formData.stampUrl} alt="Stamp Preview" width={96} height={96} className="size-full object-contain" />
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

        {/* 支社情報 */}
        <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2 border-b pb-2">
            <GitBranch className="text-blue-600" size={20} /> 支社情報（メール署名に表示）
          </h2>
          <p className="text-sm text-slate-500 mb-4">支社を登録すると、メール署名に「本社」「支社」形式で住所がまとめて表示されます。</p>

          {/* 支社一覧 */}
          <div className="space-y-3 mb-4">
            {branches.map((branch: any, idx: number) => (
              <div key={branch.id} className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">支社 {idx + 1}</span>
                  <button type="button" onClick={() => handleDeleteBranch(branch.id)} className="text-rose-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">支社名</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                      value={branch.name}
                      onChange={e => setBranches(branches.map((b: any, i: number) => i === idx ? { ...b, name: e.target.value } : b))}
                      onBlur={() => handleUpdateBranch(branch)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">郵便番号</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                      value={branch.zipCode || ""}
                      onChange={e => setBranches(branches.map((b: any, i: number) => i === idx ? { ...b, zipCode: e.target.value } : b))}
                      onBlur={() => handleUpdateBranch(branch)}
                      placeholder="100-0001"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">住所</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                      value={branch.address || ""}
                      onChange={e => setBranches(branches.map((b: any, i: number) => i === idx ? { ...b, address: e.target.value } : b))}
                      onBlur={() => handleUpdateBranch(branch)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 新規追加フォーム */}
          <div className="border border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/30 space-y-3">
            <p className="text-xs font-bold text-blue-700">+ 支社を追加</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm" placeholder="支社名 例）関東支店" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} />
              <input type="text" className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm" placeholder="郵便番号" value={newBranch.zipCode} onChange={e => setNewBranch({ ...newBranch, zipCode: e.target.value })} />
              <input type="text" className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm" placeholder="住所" value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })} />
            </div>
            <button type="button" disabled={!newBranch.name || addingBranch} onClick={handleAddBranch} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              <Plus size={16} /> 追加する
            </button>
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
