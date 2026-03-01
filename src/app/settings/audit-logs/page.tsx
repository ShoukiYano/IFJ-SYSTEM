"use client";

import { useEffect, useState } from "react";
import { History, Search, Filter, Shield, Clock, User, HardDrive } from "lucide-react";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/audit-logs")
            .then((res) => res.json())
            .then((data) => {
                setLogs(data);
                setLoading(false);
            });
    }, []);

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
        if (action.includes("DELETE")) return "text-rose-600 bg-rose-50 border-rose-100";
        if (action.includes("UPDATE")) return "text-amber-600 bg-amber-50 border-amber-100";
        return "text-slate-600 bg-slate-50 border-slate-100";
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="text-slate-400" size={32} />
                        操作ログ
                    </h1>
                    <p className="text-slate-500 mt-1">
                        テナント内で行われた重要な操作履歴を確認できます（直近100件）
                    </p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm font-bold">
                    <Shield size={16} />
                    安全に分離されています
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">日時</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">操作種別</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">対象リソース</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">実行ユーザー</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">詳細</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        読み込み中...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        操作ログが見つかりません
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                                                <Clock size={14} className="text-slate-300" />
                                                {new Date(log.createdAt).toLocaleString("ja-JP")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-900 font-medium text-sm">
                                                <HardDrive size={14} className="text-slate-400" />
                                                {log.resource}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                                                <User size={14} className="text-slate-400" />
                                                {log.userId || "システム / 未知のユーザー"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <pre className="text-[10px] text-slate-400 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                                                {log.payload || "-"}
                                            </pre>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start">
                <div className="p-2 bg-blue-100 rounded-xl">
                    <Search className="text-blue-600" size={20} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-blue-900">監査ログの保持期間について</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        現在のプランでは、直近30日間のログが保持されます。より長期のログ保存が必要な場合は、エンタープライズプランへのアップグレードをご検討ください。
                    </p>
                </div>
            </div>
        </div>
    );
}
