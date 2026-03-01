"use client";

import { useSession } from "next-auth/react";
import { ShieldAlert, LogOut, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ImpersonationBanner() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isImpersonating, setIsImpersonating] = useState(false);

    useEffect(() => {
        // Check for impersonation cookies (client-side check for UI)
        // Since cookies are HttpOnly, we rely on session.user metadata if we exposed it,
        // or just check for the cookie if it wasn't HttpOnly.
        // For security, HttpOnly is better. Let's assume we use session metadata.
        const role = (session?.user as any)?.role;
        const tenantId = (session?.user as any)?.tenantId;
        // In our tenantContext we set role to TENANT_ADMIN during impersonation
        // but System Admin's real role is SYSTEM_ADMIN.
        // Actually, let's just check if we are in a tenant path and role is TENANT_ADMIN
        // but we are a system admin.
        if (role === "TENANT_ADMIN" && (session?.user as any).email === "yanopitrombone@gmail.com") {
            // This is a bit hardcoded, but serves the purpose for now.
            // Ideally we'd have a 'isImpersonating' flag in the JWT.
            setIsImpersonating(true);
        }
    }, [session]);

    // Better approach: just check if the cookie exists (if we make it non-HttpOnly for UI)
    // Or, since we can't easily check HttpOnly cookies, let's use the session update we planned.

    // For now, let's just create a functional banner that uses an API to check status.
    useEffect(() => {
        const checkImpersonation = async () => {
            try {
                const res = await fetch("/api/admin/impersonate/status");
                if (res.ok) {
                    const data = await res.json();
                    setIsImpersonating(data.isImpersonating);
                }
            } catch (e) { }
        };
        if (session) checkImpersonation();
    }, [session]);

    const handleStop = async () => {
        const res = await fetch("/api/admin/impersonate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "STOP" }),
        });
        if (res.ok) {
            window.location.href = "/admin/dashboard";
        }
    };

    if (!isImpersonating) return null;

    return (
        <div className="bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-4 text-sm font-bold shadow-lg relative z-[100]">
            <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="animate-pulse" />
                <span>代理ログイン中: 現在テナントとして操作しています</span>
            </div>
            <button
                onClick={handleStop}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all flex items-center gap-2 border border-white/30"
            >
                <LogOut size={14} />
                管理者画面に戻る
            </button>
        </div>
    );
}
