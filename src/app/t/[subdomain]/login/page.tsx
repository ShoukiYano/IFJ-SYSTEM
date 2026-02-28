"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, AlertCircle, Building2 } from "lucide-react";

export default function TenantLoginPage({ params }: { params: { subdomain: string } }) {
  const [tenant, setTenant] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // サブドメインからテナント情報を取得（簡易的な識別）
    const fetchTenantBySubdomain = async () => {
      try {
        const res = await fetch(`/api/tenants/${params.subdomain}`);
        if (res.ok) {
          const found = await res.json();
          setTenant(found);
        } else {
          console.error("Tenant fetch failed:", res.status);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchTenantBySubdomain();
  }, [params.subdomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center">
      <Loader2 className="animate-spin text-slate-400" size={32} />
    </div>
  );

  if (!tenant) return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
        <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
        <h1 className="text-xl font-bold text-slate-800 mb-2">テナントが見つかりません</h1>
        <p className="text-slate-500 text-sm mb-6">URLが正しいかご確認ください。</p>
        <button onClick={() => router.push("/login")} className="text-blue-600 font-bold hover:underline">通常のログインへ</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-[100] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-white rounded-[2rem] shadow-xl shadow-slate-200 mb-6 border-b-4 border-indigo-600">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} className="h-12 object-contain" alt={tenant.name} />
            ) : (
              <Building2 className="text-indigo-600" size={40} />
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{tenant.name}</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">ログインポータル</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-300 border border-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">メールアドレス</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="email" required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
                  placeholder="name@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">パスワード</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="password" required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-300 hover:bg-indigo-600 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "システムにログイン"}
            </button>
          </form>
        </div>

        <p className="text-center mt-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {tenant.name}
        </p>
      </div>
    </div>
  );
}
