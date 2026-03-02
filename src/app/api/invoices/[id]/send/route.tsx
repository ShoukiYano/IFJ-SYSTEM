import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { sendMail } from "@/lib/mail";
import { renderToBuffer } from "@react-pdf/renderer";
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

        // PDF生成
        let attachments: any[] = [];
        try {
            console.log(`[send-api] Generating PDF for invoice: ${invoice.invoiceNumber}`);
            const issueDate = new Date(invoice.issueDate);
            const month = issueDate.getMonth() + 1;
            const filename = `${month}月度御請求書_${invoice.client.name}御中.pdf`;

            // Use JSX for better stability in Next.js server environment
            const pdfBuffer = await renderToBuffer(
                <InvoiceDocument invoice={invoice} company={tenant} />
            );

            console.log(`[send-api] PDF generated successfully. Filename: ${filename}, Size: ${pdfBuffer.length} bytes`);

            attachments.push({
                filename,
                content: pdfBuffer,
                contentType: 'application/pdf',
            });
        } catch (pdfError) {
            console.error("[send-api] PDF generation failed:", pdfError);
            // PDF生成に失敗してもメール送信は試みるか、あるいはエラーにするか
            // 今回は必須と思われるのでエラーにする方針ですが、安全性のためログは残します
        }

        console.log(`[send-api] Calling sendMail with ${attachments.length} attachments. tenantId: ${context.tenantId}`);
        // メール送信
        const result = await sendMail({
            to,
            subject,
            body,
            fromName: tenant?.name || "請求書管理システム",
            tenantId: context.tenantId,
            attachments,
        });

        console.log(`[send-api] sendMail result: success=${result.success}, hasError=${!!result.error}`);

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
