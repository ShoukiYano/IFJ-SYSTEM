"use client";

import { useEffect, useState } from "react";
import { HardDrive, Download, RotateCcw, Trash2, Plus, Loader2, Building2, Clock, AlertTriangle, ShieldCheck, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function AdminBackupsPage() {
    const [backups, setBackups] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState("");
    const [selectedBackup, setSelectedBackup] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchData();
        fetchTenants();
    }, []);

    const fetchData = async () => {
        const res = await fetch("/api/admin/backups");
        if (res.ok) setBackups(await res.json());
        setLoading(false);
    };

    const fetchTenants = async () => {
        const res = await fetch("/api/admin/tenants");
        if (res.ok) setTenants(await res.json());
    };

    const handleCreateBackup = async () => {
        if (!selectedTenantId) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/tenants/${selectedTenantId}/backups`, {
                method: "POST"
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                fetchData();
                showSuccess("バックアップの作成に成功しました");
            } else {
                alert("バックアップ作成に失敗しました");
            }
        } catch (e) {
            alert("通信エラーが発生しました");
        } finally {
            setProcessing(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedBackup) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/tenants/${selectedBackup.tenantId}/backups/${selectedBackup.id}/restore`, {
                method: "POST"
            });
            if (res.ok) {
                setIsRestoreModalOpen(false);
                showSuccess("データの復元（リストア）が完了しました");
            } else {
                const err = await res.json();
                alert(`リストア失敗: ${err.error || "入力データが不正です"}`);
            }
        } catch (e) {
            alert("致命的なエラーが発生しました");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (backup: any) => {
        if (!confirm("バックアップファイルを削除しますか？（復元できなくなります）")) return;
        try {
            const res = await fetch(`/api/admin/tenants/${backup.tenantId}/backups/${backup.id}`, {
                method: "DELETE"
            });
            if (res.ok) fetchData();
        } catch (e) {
            alert("削除に失敗しました");
        }
    };

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 5000);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <HardDrive size={36} className="text-slate-400" />
                        バックアップ・リストア管理
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">テナントデータの保存と災害復旧を管理します</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 font-black"
                >
                    <Plus size={20} />
                    新規バックアップ作成
                </button>
            </div>

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 size={20} />
                    <span className="font-bold">{successMessage}</span>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">作成日時</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">テナント</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ファイル名</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">サイズ</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-full" /></td>
                                </tr>
                            ))
                        ) : backups.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                    バックアップ履歴はありません
                                </td>
                            </tr>
                        ) : (
                            backups.map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                                            <Clock size={14} className="text-slate-300" />
                                            {format(new Date(b.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                                            <Building2 size={16} className="text-blue-500" />
                                            {b.tenant?.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                            {b.filename}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-400">
                                            {(b.size / 1024).toFixed(1)} KB
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <a
                                                href={`/api/admin/tenants/${b.tenantId}/backups/${b.id}`}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="ダウンロード"
                                            >
                                                <Download size={18} />
                                            </a>
                                            <button
                                                onClick={() => {
                                                    setSelectedBackup(b);
                                                    setIsRestoreModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="この時点に復元"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(b)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                title="削除"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 新規バックアップモーダル */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">バックアップの作成</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-widest">対象テナントを選択</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-lg font-bold"
                                    value={selectedTenantId}
                                    onChange={(e) => setSelectedTenantId(e.target.value)}
                                >
                                    <option value="">選択してください...</option>
                                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
                                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                    バックアップはSupabase StorageにJSON形式で保存されます。請求書、取引先、要員の全データが含まれます。
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-50">キャンセル</button>
                                <button
                                    disabled={!selectedTenantId || processing}
                                    onClick={handleCreateBackup}
                                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processing && <Loader2 size={20} className="animate-spin" />}
                                    作成実行
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* リストア確認モーダル */}
            {isRestoreModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border-4 border-rose-500/20 animate-in zoom-in duration-200">
                        <div className="p-8 bg-rose-50 border-b border-rose-100 flex justify-between items-center text-rose-900">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <RotateCcw size={28} />
                                データの復元
                            </h2>
                            <button onClick={() => setIsRestoreModalOpen(false)} className="text-rose-400 hover:text-rose-600 p-2 hover:bg-white rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <p className="text-slate-900 font-black text-xl">「{selectedBackup?.tenant?.name}」を復元しますか？</p>
                                <p className="text-slate-500 font-medium">{selectedBackup?.filename}</p>
                            </div>

                            <div className="bg-rose-100/50 p-6 rounded-3xl space-y-4 border border-rose-200">
                                <div className="flex gap-4 items-start text-rose-700">
                                    <AlertTriangle className="shrink-0" size={24} />
                                    <div className="space-y-1">
                                        <p className="font-black text-sm uppercase tracking-widest leading-none mb-2">CRITICAL WARNING</p>
                                        <p className="text-sm font-bold leading-relaxed">
                                            リストアを実行すると、該当テナントの現在の請求書、取引先、要員データは**すべて削除され**、バックアップ時の状態に上書きされます。
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 text-center px-4">
                                この操作は取り消せません。実行前に現在のデータのバックアップを取ることを強くお勧めします。
                            </p>

                            <div className="flex gap-4">
                                <button onClick={() => setIsRestoreModalOpen(false)} className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-50">中止する</button>
                                <button
                                    disabled={processing}
                                    onClick={handleRestore}
                                    className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20"
                                >
                                    {processing && <Loader2 size={20} className="animate-spin" />}
                                    復元を確定する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
