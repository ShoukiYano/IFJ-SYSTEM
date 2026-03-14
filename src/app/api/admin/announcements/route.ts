export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function GET() {
    try {
        const context = await getTenantContext();
        if (!context || (context.role !== "SYSTEM_ADMIN" && (context as any).originalRole !== "SYSTEM_ADMIN")) {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }

        const announcements = await (prisma as any).announcement.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("GET /api/admin/announcements error:", error);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context || (context.role !== "SYSTEM_ADMIN" && (context as any).originalRole !== "SYSTEM_ADMIN")) {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }

        const body = await req.json();
        const { title, content, isPublished } = body;

        if (!title || !content) {
            return NextResponse.json({ error: "タイトルと本文は必須です" }, { status: 400 });
        }

        const announcement = await (prisma as any).announcement.create({
            data: {
                title,
                content,
                isPublished: isPublished !== undefined ? isPublished : true,
            },
        });

        return NextResponse.json(announcement);
    } catch (error) {
        console.error("POST /api/admin/announcements error:", error);
        return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
    }
}
