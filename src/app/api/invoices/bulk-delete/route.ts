import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function DELETE(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const { ids, physical } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "削除するIDを指定してください" }, { status: 400 });
        }

        if (physical === true) {
            // 物理削除
            const result = await prisma.invoice.deleteMany({
                where: {
                    id: { in: ids },
                    tenantId: context.tenantId,
                    deletedAt: { not: null }, // ゴミ箱にあるもののみ物理削除可能とする安全策
                },
            });
            return NextResponse.json({ success: true, count: result.count, type: "physical" });
        }

        // ソフトデリート（論理削除）
        const result = await prisma.invoice.updateMany({
            where: {
                id: { in: ids },
                tenantId: context.tenantId,
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, count: result.count });
    } catch (error) {
        console.error("DELETE /api/invoices/bulk-delete error:", error);
        return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
    }
}
