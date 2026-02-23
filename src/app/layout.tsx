import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invoice Flow Japan",
  description: "日本の商慣習に合わせた請求書管理システム",
};

import { NextAuthProvider } from "@/components/providers/SessionProvider";
import Sidebar from "@/components/layout/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <NextAuthProvider>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-4">
              {children}
            </main>
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
