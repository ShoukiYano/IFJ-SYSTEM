import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { sendMail } from "@/lib/mail";
import { renderToBuffer, Document, Page, Text } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";
import React from "react";

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

        // Googleトークンの確認（デバッグ用）
        const googleToken = await prisma.googleOAuthToken.findUnique({
            where: { tenantId: context.tenantId }
        });
        console.log(`[send-api] Google Token Check: found=${!!googleToken}, hasRefreshToken=${!!googleToken?.refreshToken}`);

        // Generate accessId and password if missing
        if (!(invoice as any).accessId || !(invoice as any).downloadPassword) {
            const accessId = crypto.randomUUID();
            const password = Math.random().toString(36).slice(-8); // Random 8 character password
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await (prisma.invoice as any).update({
                where: { id: invoice.id },
                data: {
                    accessId,
                    downloadPassword: password,
                    accessExpiresAt: expiresAt,
                },
            });
            // Update local object for email body
            (invoice as any).accessId = accessId;
            (invoice as any).downloadPassword = password;
            (invoice as any).accessExpiresAt = expiresAt;
        }

        const downloadUrl = `${process.env.NEXTAUTH_URL}/public/invoices/${(invoice as any).accessId}`;
        const updatedBody = `${body}

--------------------------------------------------
請求書の表示・ダウンロードはこちらからお願いいたします。
URL: ${downloadUrl}
パスワード: ${(invoice as any).downloadPassword}
--------------------------------------------------

※このURLから請求書の内容を確認いただけます。
※ブラウザで開いた後にPDFとして保存できます。
`;

        console.log(`[send-api] Sending email with link. tenantId: ${context.tenantId}`);
        // メール送信
        const result = await sendMail({
            to,
            subject,
            body: updatedBody,
            fromName: tenant?.name || "請求書管理システム",
            tenantId: context.tenantId,
        });

        console.log(`[send-api] sendMail result: success=${result.success}`);

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
