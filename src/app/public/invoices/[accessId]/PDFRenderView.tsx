"use client";

import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";

interface PDFRenderViewProps {
    invoice: any;
    company: any;
}

export const PDFRenderView: React.FC<PDFRenderViewProps> = ({ invoice, company }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const filename = `${invoice.issueDate ? new Date(invoice.issueDate).getMonth() + 1 : ""}月度御請求書_${invoice.client?.name || ""}御中`;

    const handleDownload = async () => {
        setIsGenerating(true);
        setErrorMsg(null);

        try {
            // 1. PDFをブラウザ上で生成
            const pdfBlob = await pdf(
                <InvoiceDocument invoice={invoice} company={company} />
            ).toBlob();

            // 2. ダウンロードを開始
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // 成功メッセージ（必要であれば）
            setIsGenerating(false);
        } catch (e) {
            console.error("PDF download error:", e);
            setErrorMsg("ダウンロードに失敗しました。もう一度お試しください。");
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* ヘッダー */}
            <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                    {invoice.invoiceNumber}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{invoice.client?.name} 御中</p>
            </div>

                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 text-lg"
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                            PDFを生成中...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            請求書(PDF)をダウンロード
                        </>
                    )}
                </button>

            {/* エラー表示 */}
            {errorMsg && (
                <p className="mt-4 text-red-500 text-sm">{errorMsg}</p>
            )}
        </div>
    );
};
