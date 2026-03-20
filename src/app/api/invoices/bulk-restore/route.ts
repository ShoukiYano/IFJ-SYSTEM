import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function POST(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "復元するIDを指定してください" }, { status: 400 });
        }

        // ソフトデリートの解除（deletedAt を null に戻す）
        const result = await prisma.invoice.updateMany({
            where: {
                id: { in: ids },
                tenantId: context.tenantId,
                deletedAt: { not: null },
            },
            data: {
                deletedAt: null,
            },
        });

        return NextResponse.json({ success: true, count: result.count });
    } catch (error) {
        console.error("POST /api/invoices/bulk-restore error:", error);
        return NextResponse.json({ error: "復元に失敗しました" }, { status: 500 });
    }
}
