import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { sendMail, renderTemplate } from "@/lib/mail";
import { formatCurrency } from "@/lib/utils";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const { subject, body, to } = await req.json();

        if (!to || !subject || !body) {
            return NextResponse.json({ error: "宛先、件名、本文は必須です" }, { status: 400 });
        }

        // 請求書データの取得（権限チェック含め）
        const invoice = await prisma.invoice.findUnique({
            where: {
                id: params.id,
                tenantId: context.tenantId,
            },
            include: {
                client: true,
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "請求書が見つかりません" }, { status: 404 });
        }

        // テナント名の取得
        const tenant = await prisma.tenant.findUnique({
            where: { id: context.tenantId }
        });

        // メール送信
        const result = await sendMail({
            to,
            subject,
            body,
            fromName: tenant?.name || "請求書管理システム",
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // 監査ログの記録などの後処理があればここに追加

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error("POST /api/invoices/[id]/send error:", error);
        return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 });
    }
}
