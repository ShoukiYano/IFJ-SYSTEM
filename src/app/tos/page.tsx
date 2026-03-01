import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export default async function TosPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Already accepted?
    if ((session.user as any).tosAccepted) {
        redirect("/");
    }

    async function acceptTos() {
        "use server";
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) return;

        await (prisma as any).user.update({
            where: { id: session.user.id },
            data: { tosAcceptedAt: new Date() },
        });

        revalidatePath("/");
        redirect("/");
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
                    {/* Subtle patterns */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
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

                    {/* Policy Placeholder */}
                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">※ これはデモンストレーション用の規約案です。実際の運用にあたっては法的なレビューを受けた正式な規約を掲載してください。</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <div className="text-slate-500 text-sm flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        同意ボタンを押すことで、上記内容を承諾したとみなされます
                    </div>
                    <form action={acceptTos}>
                        <button
                            type="submit"
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 group shadow-lg shadow-slate-200"
                        >
                            同意して利用を開始する
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
