import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenantContext";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const token = await prisma.googleOAuthToken.findUnique({
            where: { tenantId: context.tenantId },
            select: { email: true, createdAt: true }
        });

        return NextResponse.json({
            connected: !!token,
            email: token?.email || null,
            connectedAt: token?.createdAt || null,
        });
    } catch (error) {
        return NextResponse.json({ error: "ステータスの取得に失敗しました" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        await prisma.googleOAuthToken.delete({
            where: { tenantId: context.tenantId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "連携解除に失敗しました" }, { status: 500 });
    }
}
