"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Trash2, ChevronLeft, Loader2, Mail, Info } from "lucide-react";
import Link from "next/link";

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        subject: "",
        content: "",
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch("/api/email-templates");
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch templates:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (template: any) => {
        setSelectedTemplate(template);
        setEditForm({
            name: template.name,
            subject: template.subject,
            content: template.content,
        });
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setEditForm({
            name: "",
            subject: "",
            content: "",
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = selectedTemplate
                ? `/api/email-templates/${selectedTemplate.id}`
                : "/api/email-templates";
            const method = selectedTemplate ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                alert("保存しました");
                fetchTemplates();
                if (!selectedTemplate) {
                    const saved = await res.json();
                    setSelectedTemplate(saved);
                }
            } else {
                const err = await res.json();
                alert(`エラー: ${err.error}`);
            }
        } catch (error) {
            alert("通信エラーが発生しました");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("このテンプレートを削除しますか？")) return;
        try {
            const res = await fetch(`/api/email-templates/${id}`, { method: "DELETE" });
            if (res.ok) {
                setTemplates(templates.filter(t => t.id !== id));
                if (selectedTemplate?.id === id) {
                    handleCreateNew();
                }
            }
        } catch (error) {
            alert("削除に失敗しました");
        }
    };

    if (loading) return <div className="p-8">読み込み中...</div>;

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <Link href="/settings" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 transition-colors">
                    <ChevronLeft size={20} />
                    設定に戻る
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Mail className="text-indigo-600" />
                            メールテンプレート設定
                        </h1>
                        <p className="text-slate-500 mt-1">請求書送付時などに使用するメールの定型文を管理します</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                    >
                        <Plus size={20} />
                        新規作成
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* テンプレート一覧 */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">テンプレート一覧</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {templates.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {templates.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => handleSelect(t)}
                                        className={`p-4 cursor-pointer hover:bg-slate-50 transition group flex justify-between items-center ${selectedTemplate?.id === t.id ? 'bg-indigo-50/50 border-r-4 border-r-indigo-500' : ''
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800">{t.name}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[180px]">{t.subject}</div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                            className="text-slate-300 hover:text-rose-500 p-2 transition opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                テンプレートがありません
                            </div>
                        )}
                    </div>
                </div>

                {/* 編集フォーム */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">
                                {selectedTemplate ? "テンプレート編集" : "新規テンプレート作成"}
                            </h2>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">テンプレート名</label>
                                    <input
                                        required
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                                        placeholder="例: 請求書送付（標準）"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">件名</label>
                                    <input
                                        required
                                        type="text"
                                        value={editForm.subject}
                                        onChange={e => setEditForm({ ...editForm, subject: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                                        placeholder="請求書送付のご案内（{{invoiceNumber}}）"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <label className="block text-sm font-bold text-slate-700">本文</label>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Info size={12} />
                                            変数を埋め込めます
                                        </div>
                                    </div>
                                    <textarea
                                        required
                                        rows={12}
                                        value={editForm.content}
                                        onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-mono text-sm leading-relaxed"
                                        placeholder={`{{clientName}} 様\n\nお世話になっております...\n自社名：{{companyName}}\n請求書番号：{{invoiceNumber}}`}
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">利用可能な変数</h4>
                                <div className="flex flex-wrap gap-2">
                                    {["{{clientName}}", "{{companyName}}", "{{invoiceNumber}}", "{{totalAmount}}", "{{dueDate}}", "{{issueDate}}"].map(v => (
                                        <code key={v} className="bg-white px-2 py-0.5 rounded border border-amber-200 text-xs text-amber-900">{v}</code>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                    テンプレートを保存する
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
