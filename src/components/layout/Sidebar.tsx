"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, FileText, Users, Settings, PlusCircle, HelpCircle, LogOut, Book, Building2, X, Bell, Megaphone, HardDrive, History } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import AnnouncementPanel from "@/components/announcements/AnnouncementPanel";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [effectiveFeatures, setEffectiveFeatures] = useState({
    hasInvoiceFeature: (session?.user as any)?.hasInvoiceFeature !== false,
    hasAttendanceFeature: (session?.user as any)?.hasAttendanceFeature === true,
  });

  useEffect(() => {
    const checkImpersonation = async () => {
      try {
        const res = await fetch("/api/admin/impersonate/status");
        if (res.ok) {
          const data = await res.json();
          console.log("[SIDEBAR] Impersonation status:", data);
          setIsImpersonating(data.isImpersonating);
          if (data.isImpersonating) {
            setEffectiveFeatures({
              hasInvoiceFeature: data.hasInvoiceFeature,
              hasAttendanceFeature: data.hasAttendanceFeature,
            });
          }
        }
      } catch (e) { }
    };
    if (session) {
      checkImpersonation();
      // 初期値はセッションから
      setEffectiveFeatures({
        hasInvoiceFeature: (session?.user as any)?.hasInvoiceFeature !== false,
        hasAttendanceFeature: (session?.user as any)?.hasAttendanceFeature === true,
      });
    }
  }, [session]);

  const role = (session?.user as any)?.role;
  const isTenantAdmin = role === "TENANT_ADMIN" || (isImpersonating && role === "SYSTEM_ADMIN");

  const menuItems = [
    { label: "ダッシュボード", icon: LayoutDashboard, href: "/" },
    { label: "見積書管理", icon: FileText, href: "/quotations", feature: "invoice" },
    { label: "請求書管理", icon: PlusCircle, href: "/invoices", feature: "invoice" },
    { label: "勤怠管理", icon: FileText, href: isTenantAdmin ? "/attendance/manage" : "/attendance", feature: "attendance" },
    { label: "シフト管理", icon: PlusCircle, href: isTenantAdmin ? "/attendance/shifts" : "/attendance#shifts", feature: "attendance" },
    { label: "要員管理", icon: Users, href: "/staff" },
    { label: "取引先管理", icon: Users, href: "/clients" },
    { label: "操作マニュアル", icon: Book, href: "/manual" },
    { label: "ユーザー管理", icon: Users, href: "/settings/users" },
    { label: "操作ログ", icon: FileText, href: "/settings/audit-logs" },
    { label: "システム設定", icon: Settings, href: "/settings" },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // 1. Feature flag control
    if ((item as any).feature === "invoice" && !effectiveFeatures.hasInvoiceFeature) return false;
    if ((item as any).feature === "attendance" && !effectiveFeatures.hasAttendanceFeature) return false;

    // 2. Role-based restriction for general users
    if (role === "TENANT_USER") {
      return ["勤怠管理", "シフト管理"].includes(item.label);
    }

    return true;
  });

  const adminItems = [
    { label: "システム管理", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "テナント管理", icon: Building2, href: "/admin/tenants" },
    { label: "お知らせ管理", icon: Megaphone, href: "/admin/announcements" },
    { label: "バックアップ管理", icon: HardDrive, href: "/admin/backups" },
    { label: "システム監査ログ", icon: History, href: "/admin/audit-logs" },
    { label: "プロフィール設定", icon: Settings, href: "/admin/profile" },
  ];


  // 代理ログイン中はテナントメニューを表示、それ以外は role で判定
  const showTenantMenu = isImpersonating || role !== "SYSTEM_ADMIN";
  const showAdminMenu = !isImpersonating && role === "SYSTEM_ADMIN";

  const handleStopImpersonating = async () => {
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        body: JSON.stringify({ action: "STOP" }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        window.location.href = "/admin/dashboard";
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!session) return null;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "w-64 bg-[#1a1c23] h-screen fixed left-0 top-0 text-slate-400 flex flex-col p-4 z-50 transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-4 mb-4 flex justify-between items-center text-white">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-tighter">IFJ-SYSTEM</h1>
              {showTenantMenu && <AnnouncementPanel />}
            </div>
            {isImpersonating && (
              <div className="flex items-center justify-between bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-lg border border-rose-500/20 mt-2">
                <span className="text-[10px] font-bold">代理ログイン中</span>
                <button 
                  onClick={handleStopImpersonating}
                  className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded font-black hover:bg-rose-600 transition"
                >
                  解除
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {showTenantMenu && filteredMenuItems.map((item) => (
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

          {showAdminMenu && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">システム管理</p>
              {adminItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                    pathname === item.href
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800 space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center gap-3 border border-slate-700/50">
            <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
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
    </>
  );
};

export default Sidebar;
