"use client";

import React, { useEffect, useState } from "react";
import { LayoutDashboard, Building2, Users, Receipt, ShieldAlert, ExternalLink, Activity, Search, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = () => {
        setLoading(true);
        fetch("/api/admin/tenants")
            .then(res => res.json())
            .then(data => {
                setTenants(data);
                setStats({
                    total: data.length,
                    active: data.filter((t: any) => t.isActive).length,
                    pending: 0, // Placeholder
                });
                setLoading(false);
            });
    };

    const toggleTenant = async (id: string, currentStatus: boolean) => {
        // API: PATCH /api/admin/tenants/[id]
        const res = await fetch(`/api/admin/tenants/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !currentStatus }),
        });
        if (res.ok) fetchTenants();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-indigo-600" size={36} />
                        システム管理者ダッシュボード
                    </h1>
                    <p className="text-slate-500 mt-2">全テナントの稼働状況とシステム全体の統計を確認します</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        <span className="text-sm font-bold text-slate-700">システム正常稼働中</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<Building2 />} title="総テナント数" value={stats.total} color="indigo" />
                <StatCard icon={<Activity />} title="アクティブテナント" value={stats.active} color="emerald" />
                <StatCard icon={<Users />} title="総ユーザー数" value={tenants.reduce((acc, t) => acc + t._count.users, 0)} color="blue" />
                <StatCard icon={<Receipt />} title="当月発行請求書" value="---" color="amber" />
            </div>

            {/* Tenant List */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-bold text-slate-900">テナント一覧</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text" placeholder="テナント名で検索..."
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">テナント / サブドメイン</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">ステータス</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">ユーザー / 取引先</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">登録日</th>
                                <th className="px-8 py-5 text-right text-[11px] font-black uppercase text-slate-400 tracking-widest">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400">Loading...</td></tr>
                            ) : tenants.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-slate-900">{t.name}</div>
                                        <div className="text-xs text-indigo-500 font-medium">@{t.subdomain || "no-subdomain"}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={() => toggleTenant(t.id, t.isActive)}
                                            className={`flex items-center gap-2 text-xs font-black ${t.isActive ? "text-emerald-600" : "text-rose-500"}`}
                                        >
                                            {t.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                            {t.isActive ? "ACTIVE" : "DISABLED"}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm"><span className="font-bold text-slate-700">{t._count.users}</span> <span className="text-slate-400">users</span></div>
                                            <div className="text-sm"><span className="font-bold text-slate-700">{t._count.clients}</span> <span className="text-slate-400">clients</span></div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-slate-400 text-xs">
                                        {new Date(t.createdAt).toLocaleDateString("ja-JP")}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch("/api/admin/impersonate", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ tenantId: t.id }),
                                                    });
                                                    if (res.ok) {
                                                        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");
                                                        if (isLocalhost) {
                                                            window.location.href = `${window.location.protocol}//${t.subdomain}.localhost:${window.location.port || "3000"}/`;
                                                        } else {
                                                            window.location.href = `${window.location.origin}/t/${t.subdomain}`;
                                                        }
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                                            >
                                                <ShieldAlert size={14} /> 代理ログイン
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, color }: any) {
    const colors: any = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    };
    return (
        <div className={`p-6 rounded-[32px] border ${colors[color]} shadow-sm space-y-4`}>
            <div className="p-3 bg-white w-fit rounded-2xl shadow-sm">
                {React.cloneElement(icon as React.ReactElement, { size: 20 })}
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-60">{title}</p>
                <p className="text-3xl font-black mt-1 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
