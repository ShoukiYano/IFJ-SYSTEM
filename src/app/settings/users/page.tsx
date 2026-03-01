"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Shield, Mail, Edit2, Trash2, Key } from "lucide-react";
import UserModal from "@/components/settings/UserModal";

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = () => {
        setLoading(true);
        fetch("/api/users")
            .then((res) => res.json())
            .then((data) => {
                setUsers(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("本当にこのユーザーを削除しますか？")) return;
        const res = await fetch("/api/users", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        if (res.ok) fetchUsers();
        else {
            const data = await res.json();
            alert(data.error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="text-slate-400" size={32} />
                        ユーザー管理
                    </h1>
                    <p className="text-slate-500 mt-1">テナント内のスタッフと権限を管理します</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200/50 active:scale-95"
                >
                    <UserPlus size={20} />
                    ユーザーを招待
                </button>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-wider text-slate-400">名前</th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-wider text-slate-400">権限</th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-wider text-slate-400">メールアドレス</th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-wider text-slate-400">登録日</th>
                            <th className="px-8 py-5 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-slate-400">読み込み中...</td></tr>
                        ) : users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="font-bold text-slate-900">{u.name || "未設定"}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${u.role === "TENANT_ADMIN"
                                            ? "text-blue-600 bg-blue-50 border-blue-100"
                                            : "text-slate-600 bg-slate-50 border-slate-100"
                                        }`}>
                                        <Shield size={12} />
                                        {u.role === "TENANT_ADMIN" ? "管理者" : "一般"}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-slate-500 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-slate-300" />
                                        {u.email}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-slate-400 text-xs">
                                    {new Date(u.createdAt).toLocaleDateString("ja-JP")}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedUser(u);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <UserModal
                    user={selectedUser}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchUsers}
                />
            )}
        </div>
    );
}
