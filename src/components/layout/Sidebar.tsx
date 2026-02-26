"use client";

import React from "react";
import { LayoutDashboard, FileText, Users, Settings, PlusCircle, HelpCircle, LogOut, Book } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    { label: "ダッシュボード", icon: LayoutDashboard, href: "/" },
    { label: "見積書管理", icon: FileText, href: "/quotations" },
    { label: "請求書管理", icon: PlusCircle, href: "/invoices" },
    { label: "取引先管理", icon: Users, href: "/clients" },
    { label: "CSV変換ツール", icon: FileText, href: "/tools/excel-converter" },
    { label: "操作マニュアル", icon: Book, href: "/manual" },
    { label: "システム設定", icon: Settings, href: "/settings" },
  ];

  if (!session) return null;

  return (
    <aside className="w-64 bg-[#1a1c23] h-screen fixed left-0 top-0 text-slate-400 flex flex-col p-4 z-50">
      <div className="p-4 mb-8">
        <h1 className="text-white text-xl font-black tracking-tighter">IFJ-SYSTEM</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
              pathname === item.href 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center gap-3 border border-slate-700/50">
          <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner">
            {session.user?.name?.substring(0, 2).toUpperCase() || "US"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-white font-bold text-sm truncate">{session.user?.name || "User"}</p>
            <p className="text-[10px] text-slate-500 truncate">{session.user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold text-sm"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
