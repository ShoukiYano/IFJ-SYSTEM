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
                    <div className="fixed top-0 left-0 md:left-64 h-full w-full md:w-[400px] bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] z-[101] flex flex-col animate-in slide-in-from-left duration-500 ease-out border-r border-slate-200">
                        {/* Header */}
                        <div className="p-8 border-b border-white/10 bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-600 text-white relative overflow-hidden">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 size-32 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 size-48 bg-blue-400/20 rounded-full blur-3xl" />

                            <div className="relative flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                            <Megaphone size={20} className="text-white" />
                                        </div>
                                        <h2 className="text-2xl font-black tracking-tight whitespace-nowrap">
                                            システムお知らせ
                                        </h2>
                                    </div>
                                    <p className="text-xs text-blue-100 font-medium pl-12 opacity-90">
                                        アップデート情報 & 重要なお知らせ
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10 active:scale-95"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 bg-slate-50/50">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                                    <div className="relative">
                                        <div className="size-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                        <Bell size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading...</p>
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center space-y-5">
                                    <div className="size-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm">
                                        <Bell size={36} strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-slate-800">お知らせはありません</p>
                                        <p className="text-xs text-slate-400 font-medium">最新情報を楽しみにお待ちください</p>
                                    </div>
                                </div>
                            ) : (
                                announcements.map((a) => (
                                    <div
                                        key={a.id}
                                        className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-full border border-blue-100/50">
                                                {format(new Date(a.createdAt), 'yyyy.MM.dd', { locale: ja })}
                                            </span>
                                            {!a.isRead && (
                                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full border border-rose-100">
                                                    <span className="size-1.5 rounded-full bg-rose-600 animate-pulse" />
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-black text-slate-900 leading-snug group-hover:text-blue-700 transition-colors mb-4 text-lg">
                                            {a.title}
                                        </h3>
                                        <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50">
                                            {a.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-white text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                <span className="w-8 h-[1px] bg-slate-100" />
                                IFJ-SYSTEM VERSION 1.2.0
                                <span className="w-8 h-[1px] bg-slate-100" />
                            </p>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
