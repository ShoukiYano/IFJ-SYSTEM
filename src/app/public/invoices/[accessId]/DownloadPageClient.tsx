"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PDFPreviewProps } from "@/components/pdf/PDFClientWrapper";

// Dynamically import PDF components to avoid SSR issues
const InvoiceDocument = dynamic(
    () => import("@/components/pdf/InvoiceDocument").then((mod) => mod.InvoiceDocument),
    { ssr: false }
);

const PDFViewer = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
    { ssr: false }
);

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

interface DownloadPageClientProps {
    invoice: any;
    company: any;
    correctPassword: string;
}

export default function DownloadPageClient({
    invoice,
    company,
    correctPassword
}: DownloadPageClientProps) {
    const [password, setPassword] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === correctPassword) {
            setIsAuthorized(true);
            setError("");
        } else {
            setError("パスワードが正しくありません。");
        }
    };

    if (!isAuthorized) {
        return (
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">請求書ダウンロード</h1>
                <p className="text-gray-600 mb-6 text-center text-sm">
                    メールに記載されているパスワードを入力してください。
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="パスワードを入力"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md active:transform active:scale-[0.98]"
                    >
                        表示する
                    </button>
                </form>
            </div>
        );
    }

    const filename = `請求書_${invoice.invoiceNumber}.pdf`;

    return (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]">
            <div className="bg-gray-800 p-4 flex items-center justify-between text-white">
                <h2 className="font-semibold truncate mr-4">
                    {invoice.invoiceNumber} - {invoice.client.name}
                </h2>
                <PDFDownloadLink
                    document={<InvoiceDocument invoice={invoice} company={company} />}
                    fileName={filename}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {((props: any) =>
                        props.loading ? "準備中..." : "PDFを保存する"
                    ) as any}
                </PDFDownloadLink>
            </div>

            <div className="flex-1 bg-gray-200">
                <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
                    <InvoiceDocument invoice={invoice} company={company} />
                </PDFViewer>
            </div>
        </div>
    );
}
