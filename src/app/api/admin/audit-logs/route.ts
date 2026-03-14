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

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "100");

        const logs = await (prisma as any).auditLog.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                tenant: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET /api/admin/audit-logs error:", error);
        return NextResponse.json({ error: "監査ログの取得に失敗しました" }, { status: 500 });
    }
}
