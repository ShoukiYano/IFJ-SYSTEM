"use client";

import { useState, useEffect } from "react";
import { Bell, X, Megaphone, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AnnouncementPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch("/api/announcements");
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
                const unread = data.filter((a: any) => !a.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPanel = async () => {
        setIsOpen(true);

        // 未読のお知らせがあれば既読にする
        const unreadIds = announcements.filter((a: any) => !a.isRead).map((a: any) => a.id);
        if (unreadIds.length > 0) {
            try {
                const res = await fetch("/api/announcements/read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ announcementIds: unreadIds }),
                });
                if (res.ok) {
                    // 既読状態を同期
                    setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
                    setUnreadCount(0);
                }
            } catch (error) {
                console.error("Failed to mark as read:", error);
            }
        }
    };

    return (
        <>
            {/* ベルアイコン（サイドバーで使用） */}
            <button
                onClick={handleOpenPanel}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group"
                title="お知らせ"
            >
                <Bell size={22} className="group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#1a1c23] px-1 animate-in zoom-in duration-300 shadow-lg">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* スライドパネル */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Megaphone className="text-blue-600" /> システムお知らせ
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">アップデート情報・重要なお知らせ</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                    <p className="text-sm font-bold text-slate-400">取得中...</p>
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-60 text-center space-y-4">
                                    <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
                                        <Bell size={32} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">お知らせはありません</p>
                                        <p className="text-xs text-slate-400 mt-1">最新情報を楽しみにお待ちください</p>
                                    </div>
                                </div>
                            ) : (
                                announcements.map((a) => (
                                    <div
                                        key={a.id}
                                        className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                                                {format(new Date(a.createdAt), 'yyyy.MM.dd', { locale: ja })}
                                            </span>
                                            {!a.isRead && (
                                                <span className="flex h-2 w-2 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors mb-3">
                                            {a.title}
                                        </h3>
                                        <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed border-t border-slate-50 pt-3">
                                            {a.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                IFJ-SYSTEM Version 1.2.0 <ChevronRight size={10} />
                            </p>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
