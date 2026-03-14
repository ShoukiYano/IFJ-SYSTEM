"use client";

import { useEffect, useState } from "react";
import { History, Search, Filter, Shield, Clock, User, HardDrive, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetch("/api/admin/audit-logs")
            .then((res) => res.json())
            .then((data) => {
                setLogs(data);
                setLoading(false);
            });
    }, []);

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "text-emerald-700 bg-emerald-50 border-emerald-100";
        if (action.includes("DELETE")) return "text-rose-700 bg-rose-50 border-rose-100";
        if (action.includes("UPDATE")) return "text-amber-700 bg-amber-50 border-amber-100";
        if (action.includes("RESTORE")) return "text-blue-700 bg-blue-50 border-blue-100";
        return "text-slate-600 bg-slate-50 border-slate-100";
    };

    const filteredLogs = logs.filter(log =>
        log.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <History size={36} className="text-slate-400" />
                        システム全体監査ログ
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">全テナントの重要操作を横断的に監視します</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="テナント・操作で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">日時</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">テナント</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">操作</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">リソース</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ユーザー</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">詳細</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                        該当するログは見つかりません
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                                <Clock size={12} />
                                                {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                                                <Building2 size={14} />
                                                {log.tenant?.name || "システム初期化"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-tight">
                                                <HardDrive size={12} className="text-slate-400" />
                                                {log.resource}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                                                <User size={12} className="text-slate-400" />
                                                {log.userId || "SYSTEM"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] text-slate-400 max-w-[250px] truncate font-mono bg-slate-50 px-2 py-1 rounded" title={log.payload}>
                                                {log.payload || "-"}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-slate-900 text-white rounded-[2rem] p-8 flex items-center justify-between shadow-xl shadow-slate-200">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                        <Shield className="text-indigo-400" size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight">エンタープライズ・ガバナンス</h3>
                        <p className="text-slate-400 text-sm mt-1">全テナントの操作ログを統合管理。不正アクセスや誤操作の追跡を強力にサポートします。</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
