export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const context = await getTenantContext();
        if (!context || (context.role !== "SYSTEM_ADMIN" && (context as any).originalRole !== "SYSTEM_ADMIN")) {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }

        const { id } = params;
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

        return NextResponse.json(announcement);
    } catch (error) {
        console.error("PATCH /api/admin/announcements/[id] error:", error);
        return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const context = await getTenantContext();
        if (!context || (context.role !== "SYSTEM_ADMIN" && (context as any).originalRole !== "SYSTEM_ADMIN")) {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }

        const { id } = params;

        await (prisma as any).announcement.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/announcements/[id] error:", error);
        return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
    }
}
