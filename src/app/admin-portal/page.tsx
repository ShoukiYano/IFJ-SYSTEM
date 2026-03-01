"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2, AlertCircle, ShieldAlert } from "lucide-react";

function AdminPortalContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const secretKey = searchParams.get("key");

    const VALID_KEY = "ifj-system-2026";

    useEffect(() => {
        if (secretKey === VALID_KEY) {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
        }
    }, [secretKey]);

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

    if (isAuthorized === false) {
        return (
            <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
                    <ShieldAlert className="mx-auto text-rose-500 mb-4" size={48} />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">アクセスが拒否されました</h1>
                    <p className="text-slate-500 text-sm mb-6">このページにアクセスするための権限、または正しい合言葉が必要です。</p>
                    <button onClick={() => router.push("/")} className="text-blue-600 font-bold hover:underline">トップページに戻る</button>
                </div>
            </div>
        );
    }

    if (isAuthorized === null) {
        return (
            <div className="fixed inset-0 bg-slate-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-[100] px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200 mb-6 border-b-4 border-indigo-500">
                        <ShieldAlert className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Portal</h1>
                    <p className="text-slate-500 font-medium mt-2">システム管理者としてログインしてください</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">メールアドレス</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email" required
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="admin@example.com"
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
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "管理システムにログイン"}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    ACCESS RESTRICTED TO SYSTEM ADMINISTRATORS
                </p>
            </div>
        </div>
    );
}

export default function AdminPortalPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-slate-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        }>
            <AdminPortalContent />
        </Suspense>
    );
}
