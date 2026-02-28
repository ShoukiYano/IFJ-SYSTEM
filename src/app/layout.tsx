import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IFJ-SYSTEM",
  description: "日本の商慣習に合わせた請求書管理システム",
  icons: {
    icon: "/icon.png",
  },
};

"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Menu } from "lucide-react";
import { NextAuthProvider } from "@/components/providers/SessionProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="ja">
      <body className={inter.className}>
        <NextAuthProvider>
          <div className="flex min-h-screen bg-slate-50">
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
        </NextAuthProvider>
      </body>
    </html>
  );
}
