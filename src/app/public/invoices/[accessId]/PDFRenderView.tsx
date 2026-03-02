"use client";

import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";

interface PDFRenderViewProps {
    invoice: any;
    company: any;
}

// ランダムな8文字のZIPパスワードを生成
function generateZipPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const PDFRenderView: React.FC<PDFRenderViewProps> = ({ invoice, company }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [zipPassword, setZipPassword] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const filename = `${invoice.issueDate ? new Date(invoice.issueDate).getMonth() + 1 : ""}月度御請求書_${invoice.client?.name || ""}御中`;

    const handleDownload = async () => {
        setIsGenerating(true);
        setErrorMsg(null);
        setZipPassword(null);

        try {
            // 1. PDFをブラウザ上で生成
            const pdfBlob = await pdf(
                <InvoiceDocument invoice={invoice} company={company} />
            ).toBlob();

            // 2. ZIPパスワードを生成
            const zipPass = generateZipPassword();

            // 3. @zip.js/zip.js でAES暗号化ZIPを作成
            const { BlobWriter, BlobReader, ZipWriter } = await import("@zip.js/zip.js");

            const zipBlobWriter = new BlobWriter("application/zip");
            const zipWriter = new ZipWriter(zipBlobWriter, {
                password: zipPass,
                encryptionStrength: 3, // AES-256
            });

            await zipWriter.add(`${filename}.pdf`, new BlobReader(pdfBlob));
            await zipWriter.close();

            const zipBlob = await zipBlobWriter.getData();

            // 4. ダウンロードを開始
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // 5. ZIPパスワードを表示
            setZipPassword(zipPass);
        } catch (e) {
            console.error("ZIP download error:", e);
            setErrorMsg("ダウンロードに失敗しました。もう一度お試しください。");
        } finally {
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

            {/* ダウンロードボタン */}
            {!zipPassword && (
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 text-lg"
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                            ZIPを生成中...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            請求書ZIPをダウンロード
                        </>
                    )}
                </button>
            )}

            {/* ZIPパスワード表示 */}
            {zipPassword && (
                <div className="mt-4 space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <p className="text-green-800 font-semibold mb-1 text-sm">✅ ダウンロード完了</p>
                        <p className="text-gray-600 text-sm mb-3">ZIPファイルを解凍するには以下のパスワードを入力してください。</p>
                        <div className="bg-white border border-green-300 rounded-lg px-4 py-3 flex items-center justify-between">
                            <span className="font-mono text-2xl font-bold tracking-widest text-gray-800">{zipPassword}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(zipPassword)}
                                className="ml-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                コピー
                            </button>
                        </div>
                        <p className="text-red-500 text-xs mt-3">※ このパスワードは一度のみ表示されます。必ず保存してください。</p>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-all text-sm"
                    >
                        再ダウンロード
                    </button>
                </div>
            )}

            {/* エラー表示 */}
            {errorMsg && (
                <p className="mt-4 text-red-500 text-sm">{errorMsg}</p>
            )}
        </div>
    );
};
