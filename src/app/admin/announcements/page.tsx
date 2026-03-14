"use client";

import { useState, useEffect } from "react";
import { Plus, Bell, Trash2, Loader2, X, Megaphone, CheckCircle2, Circle, Settings } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        isPublished: true,
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch("/api/admin/announcements");
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingAnnouncement
                ? `/api/admin/announcements/${editingAnnouncement.id}`
                : "/api/admin/announcements";
            const method = editingAnnouncement ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingAnnouncement(null);
                setFormData({ title: "", content: "", isPublished: true });
                fetchAnnouncements();
            } else {
                const error = await res.json();
                alert(`エラー: ${error.error}`);
            }
        } catch (error) {
            alert("通信エラーが発生しました");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePublish = async (announcement: any) => {
        try {
            const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublished: !announcement.isPublished }),
            });
            if (res.ok) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error("Failed to toggle publish status:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("本当にお知らせを削除しますか？")) return;
        try {
            const res = await fetch(`/api/admin/announcements/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error("Failed to delete announcement:", error);
        }
    };

    const openEditModal = (announcement: any) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            isPublished: announcement.isPublished,
        });
        setIsModalOpen(true);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Megaphone className="text-indigo-600" /> お知らせ管理
                    </h1>
                    <p className="text-slate-500 mt-1">テナント様向けのシステムアップデート等を配信します</p>
                </div>
                <button
                    onClick={() => {
                        setEditingAnnouncement(null);
                        setFormData({ title: "", content: "", isPublished: true });
                        setIsModalOpen(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition font-bold"
                >
                    <Plus size={20} />
                    新規お知らせ作成
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状態</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">公開</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">タイトル</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">作成日</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {announcements.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    お知らせはありません
                                </td>
                            </tr>
                        ) : (
                            announcements.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${a.isPublished
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                            {a.isPublished ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                            {a.isPublished ? '公開中' : '非公開'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleTogglePublish(a)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${a.isPublished ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${a.isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{a.title}</div>
                                        <div className="text-xs text-slate-500 line-clamp-1">{a.content.substring(0, 50)}...</div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                                        {format(new Date(a.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(a)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="編集"
                                            >
                                                <Settings size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

            {/* お知らせ登録・編集モーダル */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Megaphone size={20} className="text-indigo-600" />
                                {editingAnnouncement ? 'お知らせの編集' : '新規お知らせの作成'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700">タイトル</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-lg font-bold"
                                    placeholder="例：【重要】システムアップデートのお知らせ"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700">本文</label>
                                <textarea
                                    required
                                    rows={10}
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none leading-relaxed"
                                    placeholder="お知らせの内容を入力してください（マークダウン等は非対応、テキストのみ推奨）"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${formData.isPublished ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                        {formData.isPublished ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">公開設定</div>
                                        <div className="text-xs text-slate-500">作成直後にテナントへ公開するか選択します</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${formData.isPublished ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${formData.isPublished ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 size={20} className="animate-spin" />}
                                    {editingAnnouncement ? '更新する' : 'お知らせを公開する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
