"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Consolidated PDF rendering component to ensure stable client-side only execution
const PDFRenderView = dynamic(
    () => import("./PDFRenderView").then((mod) => mod.PDFRenderView) as any,
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">読み込み中...</p>
            </div>
        )
    }
) as React.ComponentType<{ invoice: any; company: any }>;

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Force trimmed comparison just in case
        if (password.trim() === correctPassword.trim()) {
            setIsAuthorized(true);
            setError("");
        } else {
            setError("パスワードが正しくありません。");
        }
    };

    if (!mounted) return null;

    if (!isAuthorized) {
        return (
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">請求書ダウンロード</h1>
                <p className="text-gray-600 mb-6 text-center text-sm">
                    メールに記載されているパスワードを入力してください。<br />
                    認証後、パスワード付きZIPをダウンロードできます。
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
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md active:transform active:scale-[0.98]"
                    >
                        認証する
                    </button>
                </form>
            </div>
        );
    }

    return (
        <PDFRenderView invoice={invoice} company={company} />
    );
}
