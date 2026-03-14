export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function GET() {
    try {
        const context = await getTenantContext();
        if (!context || !context.tenantId) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const { tenantId } = context;

        // 公開中のお知らせを取得
        const announcements = await (prisma as any).announcement.findMany({
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            include: {
                reads: {
                    where: { tenantId },
                },
            },
        });

        // 読みやすく整形
        const formatted = announcements.map((a: any) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            createdAt: a.createdAt,
            isRead: a.reads.length > 0,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("GET /api/announcements error:", error);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }
}
