export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function GET(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const logs = await (prisma as any).auditLog.findMany({
            where: { tenantId: context.tenantId },
            orderBy: { createdAt: "desc" },
            take: 100, // Limit to recent 100 logs
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET /api/audit-logs error:", error);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
