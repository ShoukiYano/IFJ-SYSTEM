"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export default function TosPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session?.user && (session.user as any).tosAccepted) {
            router.push("/");
        }
    }, [status, session, router]);

    const handleAccept = async () => {
        if (isPending) return;
        setIsPending(true);
        try {
            const res = await fetch("/api/auth/tos", { method: "POST" });
            if (res.ok) {
                // Trigger session update to refresh tosAccepted in JWT
                await update({ tosAccepted: true });
                router.push("/");
                router.refresh();
            } else {
                console.error("Failed to accept ToS");
                alert("エラーが発生しました。もう一度お試しください。");
            }
        } catch (error) {
            console.error("Error accepting ToS:", error);
            alert("通信エラーが発生しました。");
        } finally {
            setIsPending(false);
        }
    };

    if (status === "loading" || (session?.user && (session.user as any).tosAccepted)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 backdrop-blur-sm">
                            <ShieldCheck className="text-emerald-400" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">利用規約への同意</h1>
                            <p className="text-slate-400 text-sm mt-1">サービス継続利用のため、内容の確認をお願いします</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto max-h-[50vh] space-y-6 text-slate-600 leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                            第1条（目的）
                        </h2>
                        <p>本規約は、当システムが提供する請求書・要員管理機能の利用に関する条件を定めるものです。利用者は、本規約に同意した上でサービスを利用するものとします。</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                            第2条（データの管理と安全性）
                        </h2>
                        <p>当システムはマルチテナント構造を採用しており、各社のデータは論理的に完全に分離されています。利用者は自社のログイン情報を適切に管理する責任を負います。</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-sm">データは自動的に暗号化され、定期的なバックアップが行われます。</p>
                        </div>
                    </section>

                    <section className="space-y-3 pb-4">
                        <h2 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                            第3条（禁止事項）
                        </h2>
                        <p>他社のデータへの不正アクセス、システムの脆弱性を突く行為、公序良俗に反する利用は固く禁止いたします。</p>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <div className="text-slate-500 text-sm flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        同意ボタンを押すことで、上記内容を承諾したとみなされます
                    </div>
                    <button
                        onClick={handleAccept}
                        disabled={isPending}
                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 group shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                処理中...
                            </>
                        ) : (
                            <>
                                同意して利用を開始する
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
