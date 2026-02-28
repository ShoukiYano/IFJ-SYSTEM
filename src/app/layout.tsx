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

import { NextAuthProvider } from "@/components/providers/SessionProvider";
import AppShell from "@/components/layout/AppShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <NextAuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </NextAuthProvider>
      </body>
    </html>
  );
}
