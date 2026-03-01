"use client";

import { useState } from "react";
import { X, Mail, User, Shield, Lock, Loader2, Save } from "lucide-react";

export default function UserModal({ user, onClose, onSave }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "TENANT_USER",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/users", {
                method: user ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user ? { ...formData, id: user.id } : formData),
            });
            if (res.ok) {
                onSave();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to save user");
            }
        } catch (e) {
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl">
            <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            {user ? "ユーザーを編集" : "ユーザーを招待"}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">テナント内のメンバー権限を管理します</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} /> 名前
                        </label>
                        <input
                            type="text" required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            placeholder="山田 太郎"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Mail size={12} /> メールアドレス
                        </label>
                        <input
                            type="email" required
                            value={formData.email}
                            disabled={!!user}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-50"
                            placeholder="yamada@example.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Shield size={12} /> 権限
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        >
                            <option value="TENANT_USER">一般ユーザー (作成・閲覧)</option>
                            <option value="TENANT_ADMIN">管理者 (全機能・ユーザー管理)</option>
                        </select>
                    </div>

                    {!user && (
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Lock size={12} /> 初期パスワード
                            </label>
                            <input
                                type="password" required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit" disabled={loading}
                            className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200/50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {user ? "更新する" : "招待を送る"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
