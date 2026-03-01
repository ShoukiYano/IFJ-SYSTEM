"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe, Mail, Lock, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function RegisterForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subdomain, setSubdomain] = useState("");
    const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

    const checkSubdomain = async (val: string) => {
        if (!val || val.length < 3) {
            setSubdomainStatus("idle");
            return;
        }
        setSubdomainStatus("checking");
        try {
            const res = await fetch(`/api/tenants/check-subdomain?subdomain=${val}`);
            const data = await res.json();
            setSubdomainStatus(data.available ? "available" : "taken");
        } catch (e) {
            setSubdomainStatus("idle");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (subdomainStatus !== "available") return;

        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const body = Object.fromEntries(formData.entries());

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "登録に失敗しました");
            }

            router.push("/login?registered=true");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-rose-100 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Company Name */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                    <Building2 size={16} className="text-slate-400" />
                    会社名
                </label>
                <input
                    name="companyName"
                    type="text"
                    required
                    placeholder="株式会社サンプル"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
            </div>

            {/* Subdomain */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                    <Globe size={16} className="text-slate-400" />
                    希望サブドメイン
                </label>
                <div className="relative">
                    <input
                        name="subdomain"
                        type="text"
                        required
                        value={subdomain}
                        onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                            setSubdomain(val);
                            checkSubdomain(val);
                        }}
                        placeholder="my-company"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-32"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-slate-400 text-sm font-medium">.service.com</span>
                        {subdomainStatus === "checking" && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        {subdomainStatus === "available" && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {subdomainStatus === "taken" && <AlertCircle size={16} className="text-rose-500" />}
                    </div>
                </div>
                {subdomainStatus === "taken" && <p className="text-xs text-rose-500 ml-1">このサブドメインは既に使用されています</p>}
            </div>

            <div className="py-2">
                <div className="h-px bg-slate-100 w-full" />
            </div>

            {/* Admin Email */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" />
                    管理者メールアドレス
                </label>
                <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@example.com"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
            </div>

            {/* Password */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                    <Lock size={16} className="text-slate-400" />
                    パスワード
                </label>
                <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
            </div>

            <button
                type="submit"
                disabled={loading || subdomainStatus !== "available"}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group shadow-xl shadow-slate-200 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" /> : "アカウントを作成する"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-sm text-slate-500">
                登録することで、利用規約とプライバシーポリシーに同意したとみなされます
            </p>
        </form>
    );
}
