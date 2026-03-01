"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
        let msg = "メールアドレスまたはパスワードが正しくありません";
        if (res.error === "ERR_USER_NOT_FOUND") msg = "エラー: ユーザーが見つかりません";
        if (res.error === "ERR_NO_PASSWORD") msg = "エラー: パスワード未設定";
        if (res.error === "ERR_INVALID_PASSWORD") msg = "エラー: パスワード不一致";
        setError(msg);
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

  return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-[100] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-200 mb-6">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">IFJ-SYSTEM</h1>
          <p className="text-slate-500 font-medium mt-2">システムにログインしてください</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">メールアドレス</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email" required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">パスワード</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password" required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100 animate-shake">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "ログイン"}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-sm font-medium flex flex-col gap-2">
          <span>パスワードをお忘れの場合は管理者にお問い合わせください。</span>
          <a href="/register" className="text-blue-600 hover:underline font-black">新規テナント（会社）の作成はこちら</a>
        </p>
      </div>
    </div>
  );
}
