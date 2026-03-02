"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Send, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { renderTemplate } from "@/lib/template";
import { formatCurrency } from "@/lib/utils";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
};

export function SendInvoiceEmailModal({ isOpen, onClose, invoice }: Props) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const [emailData, setEmailData] = useState({
        to: "",
        subject: "",
        body: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            setEmailData(prev => ({ ...prev, to: invoice.client.email || "" }));
            setSent(false);
        }
    }, [isOpen, invoice]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/email-templates");
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateChange = (id: string) => {
        setSelectedTemplateId(id);
        const template = templates.find(t => t.id === id);
        if (template) {
            const variables = {
                clientName: invoice.client.name,
                companyName: invoice.tenant?.name || "自社名未設定",
                invoiceNumber: invoice.invoiceNumber,
                totalAmount: formatCurrency(Number(invoice.totalAmount)),
                dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : "指定なし",
                issueDate: invoice.issueDate.split('T')[0],
            };

            setEmailData({
                ...emailData,
                subject: renderTemplate(template.subject, variables),
                body: renderTemplate(template.content, variables),
            });
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await fetch(`/api/invoices/${invoice.id}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailData),
            });

            if (res.ok) {
                setSent(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                const err = await res.json();
                alert(`送信に失敗しました: ${err.error}`);
            }
        } catch (error) {
            alert("通信エラーが発生しました");
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Mail size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">請求書をメールで送信</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
                        <X size={20} />
                    </button>
                </div>

                {sent ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle2 size={64} className="text-emerald-500 animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">送信完了しました</h3>
                        <p className="text-slate-500 tracking-wide">メールを正常に送信しました。画面を閉じます。</p>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">宛先メールアドレス</label>
                                    <input
                                        required
                                        type="email"
                                        value={emailData.to}
                                        onChange={e => setEmailData({ ...emailData, to: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                                        placeholder="example@client.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">テンプレート選択</label>
                                    <select
                                        value={selectedTemplateId}
                                        onChange={e => handleTemplateChange(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                                    >
                                        <option value="">テンプレートを選択してください</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-blue-700">
                                    <FileText className="shrink-0" size={20} />
                                    <div className="text-xs leading-relaxed">
                                        <p className="font-bold mb-1">添付ファイル</p>
                                        <p>{invoice.invoiceNumber}.pdf</p>
                                        <p className="text-[10px] opacity-70 mt-1">※プレビューが表示されている現在の内容が送信されます。</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">件名</label>
                                    <input
                                        required
                                        type="text"
                                        value={emailData.subject}
                                        onChange={e => setEmailData({ ...emailData, subject: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">本文</label>
                                    <textarea
                                        required
                                        rows={8}
                                        value={emailData.body}
                                        onChange={e => setEmailData({ ...emailData, body: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-mono text-xs leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                disabled={sending}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            >
                                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                メールを送信する
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
