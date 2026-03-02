import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function DELETE(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "削除するIDを指定してください" }, { status: 400 });
        }

        // ソフトデリート（テナントIDで権限チェック）
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
