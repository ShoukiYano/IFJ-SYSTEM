"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Menu } from "lucide-react";
import ImpersonationBanner from "@/components/layout/ImpersonationBanner";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <ImpersonationBanner />
            <div className="flex flex-1">
                {/* Mobile Header */}
                <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center px-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                        aria-label="メニューを開く"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="ml-2 font-black tracking-tighter text-slate-900">IFJ-SYSTEM</h1>
                </header>

                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 md:ml-64 pt-16 md:pt-0">
                    <div className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
