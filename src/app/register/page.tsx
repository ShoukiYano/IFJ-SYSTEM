import RegisterForm from "@/components/auth/RegisterForm";
import { MoveLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-3xl rounded-full -ml-40 -mt-40 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-3xl rounded-full -mr-40 -mb-40"></div>

            <div className="max-w-xl w-full relative z-10">
                <div className="mb-10 flex items-center justify-between">
                    <Link
                        href="/login"
                        className="text-slate-500 flex items-center gap-2 text-sm font-bold hover:text-slate-900 transition-colors"
                    >
                        <MoveLeft size={18} />
                        ログインに戻る
                    </Link>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                        <Sparkles className="text-emerald-500" size={14} />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Join the platform</span>
                    </div>
                </div>

                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                        新規テナント登録
                    </h1>
                    <p className="text-slate-500">
                        数分であなたの会社専用の請求・要員管理環境を構築します
                    </p>
                </div>

                <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white/50 backdrop-blur-sm">
                    <RegisterForm />
                </div>

                <footer className="mt-12 text-center text-slate-400 text-xs">
                    &copy; {new Date().getFullYear()} SES Management Platform. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
