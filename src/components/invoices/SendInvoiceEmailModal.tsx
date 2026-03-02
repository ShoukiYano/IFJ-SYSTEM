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
    const [company, setCompany] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [contactPerson, setContactPerson] = useState("");

    const [emailData, setEmailData] = useState({
        to: "",
        subject: "",
        body: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            fetchCompany();
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

    const fetchCompany = async () => {
        try {
            const [companyRes, branchRes] = await Promise.all([
                fetch("/api/company"),
                fetch("/api/branches"),
            ]);
            if (companyRes.ok) setCompany(await companyRes.json());
            if (branchRes.ok) {
                const bd = await branchRes.json();
                setBranches(Array.isArray(bd) ? bd : []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // 名刺署名ブロックを生成（支社あり/なし対応）
    const buildSignature = () => {
        if (!company) return "";
        const lines: string[] = ["━━━━━━━━━━━━━━━━━━━━━━━━━━"];

        if (branches.length > 0) {
            // 支社あり: 本社 + 各支社
            lines.push(`本社：${company.name || ""}`);
            lines.push(`住所：〒${company.zipCode || ""}`);
            lines.push(`　　　${company.address || ""}`);
            branches.forEach(b => {
                lines.push(`支社：${b.name}`);
                if (b.zipCode) lines.push(`住所：〒${b.zipCode}`);
                if (b.address) lines.push(`　　　${b.address}`);
            });
        } else {
            // 支社なし: 会社名のみ
            lines.push(`会社名：${company.name || ""}`);
            lines.push(`住所：〒${company.zipCode || ""}`);
            lines.push(`　　　${company.address || ""}`);
        }

        if (contactPerson) lines.push(`担当者：${contactPerson}`);
        if (company.tel) lines.push(`連絡先：${company.tel}`);
        lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return "\n\n" + lines.join("\n");
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
            const signature = buildSignature();

            const res = await fetch(`/api/invoices/${invoice.id}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...emailData, signature }),
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
                                {/* 担当者入力 */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">担当者名（署名に表示）</label>
                                    <input
                                        type="text"
                                        value={contactPerson}
                                        onChange={e => setContactPerson(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                                        placeholder="例）山田 太郎"
                                    />
                                </div>
                                {/* 署名プレビュー */}
                                {company && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 font-mono leading-relaxed whitespace-pre-wrap">
                                        {buildSignature().trim()}
                                    </div>
                                )}
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-blue-700">
                                    <FileText className="shrink-0" size={20} />
                                    <div className="text-xs leading-relaxed">
                                        <p className="font-bold mb-1">添付ファイル</p>
                                        <p>{new Date(invoice.issueDate).getMonth() + 1}月度御請求書_{invoice.client.name}御中.pdf</p>
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
                                        rows={10}
                                        value={emailData.body}
                                        onChange={e => setEmailData({ ...emailData, body: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-mono text-xs leading-relaxed"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">※送信時に末尾に署名が自動追加されます。</p>
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
