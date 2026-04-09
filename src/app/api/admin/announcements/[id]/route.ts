export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const context = await getTenantContext();
        if (!context || (context.role !== "SYSTEM_ADMIN" && (context as any).originalRole !== "SYSTEM_ADMIN")) {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }

        const body = await req.json();
        const { title, content, isPublished } = body;

        const announcement = await (prisma as any).announcement.update({
            where: { id },
            data: {
                title,
                content,
                isPublished,
            },
        });

        // 監査ログ
        await createAuditLog({
            action: "ANNOUNCEMENT_UPDATE",
            resource: "announcement",
            payload: { id: announcement.id, title: announcement.title },
            userId: context.userId
        });

        return NextResponse.json(announcement);
    } catch (error) {
        console.error("PATCH /api/admin/announcements/[id] error:", error);
        return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const context = await getTenantContext();
        if (!context || (context.role !== "SYSTEM_ADMIN" && (context as any).originalRole !== "SYSTEM_ADMIN")) {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }

        await (prisma as any).announcement.delete({
            where: { id },
        });

        // 監査ログ
        await createAuditLog({
            action: "ANNOUNCEMENT_DELETE",
            resource: "announcement",
            payload: { id },
            userId: context.userId
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/announcements/[id] error:", error);
        return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
    }
}
