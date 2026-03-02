import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { z } from "zod";

const templateSchema = z.object({
    name: z.string().min(1, "テンプレート名は必須です"),
    subject: z.string().min(1, "件名は必須です"),
    content: z.string().min(1, "本文は必須です"),
});

export async function GET() {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const templates = await (prisma as any).emailTemplate.findMany({
            where: { tenantId: context.tenantId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("GET /api/email-templates error:", error);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const body = await req.json();
        const validated = templateSchema.parse(body);

        const template = await (prisma as any).emailTemplate.create({
            data: {
                ...validated,
                tenantId: context.tenantId,
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("POST /api/email-templates error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "入力内容に不備があります", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
    }
}
