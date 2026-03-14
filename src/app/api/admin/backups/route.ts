import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context || context.role !== "SYSTEM_ADMIN") {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }

        const backups = await (prisma as any).tenantBackup.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                tenant: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(backups);
    } catch (error) {
        console.error("GET /api/admin/backups error:", error);
        return NextResponse.json({ error: "バックアップ一覧の取得に失敗しました" }, { status: 500 });
    }
}
