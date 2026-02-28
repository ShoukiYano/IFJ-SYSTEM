"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users, Building2, ExternalLink, Settings, X, Loader2 } from "lucide-react";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    subdomain: "",
    registrationNumber: "",
    address: "",
    tel: "",
    email: "",
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/admin/tenants");
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenant),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTenant({
          name: "",
          subdomain: "",
          registrationNumber: "",
          address: "",
          tel: "",
          email: "",
        });
        fetchTenants();
      } else {
        const error = await res.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">読み込み中...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">テナント管理</h1>
          <p className="text-slate-500 mt-1">システムの全テナントを管理します</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
        >
          <Plus size={20} />
          新規テナント作成
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <Building2 size={24} />
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${tenant.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {tenant.isActive ? '有効' : '無効'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">{tenant.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{tenant.subdomain ? `${tenant.subdomain}.example.com` : 'サブドメイン未設定'}</p>
            
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{tenant._count?.users || 0} ユーザー</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 size={16} />
                <span>{tenant._count?.clients || 0} 取引先</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link 
                href={`/admin/tenants/${tenant.id}`}
                className="flex-1 bg-slate-50 text-slate-700 py-2 rounded text-center text-sm font-medium hover:bg-slate-100 transition"
              >
                詳細・編集
              </Link>
              <button className="bg-slate-50 text-slate-700 p-2 rounded hover:bg-slate-100 transition">
                <Settings size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 新規作成モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">新規テナント登録</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">テナント名</label>
                <input 
                  required
                  type="text" 
                  value={newTenant.name}
                  onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="株式会社〇〇"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">サブドメイン (任意)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newTenant.subdomain}
                    onChange={e => setNewTenant({...newTenant, subdomain: e.target.value})}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="company"
                  />
                  <span className="text-slate-400 text-sm">.ifj.com</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">適格請求書登録番号</label>
                <input 
                  type="text" 
                  value={newTenant.registrationNumber}
                  onChange={e => setNewTenant({...newTenant, registrationNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="T123..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition"
                >
                  キャンセル
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  作成する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
