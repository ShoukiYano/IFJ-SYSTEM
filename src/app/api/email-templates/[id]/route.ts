import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { z } from "zod";

const templateSchema = z.object({
    name: z.string().min(1, "テンプレート名は必須です"),
    subject: z.string().min(1, "件名は必須です"),
    content: z.string().min(1, "本文は必須です"),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const body = await req.json();
        const validated = templateSchema.parse(body);

        const template = await (prisma as any).emailTemplate.update({
            where: {
                id,
                tenantId: context.tenantId,
            },
            data: validated,
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("PATCH /api/email-templates/[id] error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "入力内容に不備があります", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        await (prisma as any).emailTemplate.delete({
            where: {
                id,
                tenantId: context.tenantId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/email-templates/[id] error:", error);
        return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
    }
}
