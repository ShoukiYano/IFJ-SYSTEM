export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getTenantContext } from "@/lib/tenantContext";

const assigneeSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  clientId: z.string().uuid("無効な取引先IDです"),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientIdが必要です" }, { status: 400 });
    }

    const assignees = await prisma.assignee.findMany({
      where: {
        tenantId: context.tenantId,
        clientId
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(assignees);
  } catch (error) {
    console.error("GET /api/assignees error:", error);
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
    const validated = assigneeSchema.parse(body);

    const assignee = await prisma.assignee.create({
      data: {
        ...validated,
        tenantId: context.tenantId,
        contractStartDate: validated.contractStartDate ? new Date(validated.contractStartDate) : null,
        contractEndDate: validated.contractEndDate ? new Date(validated.contractEndDate) : null,
      },
    });

    return NextResponse.json(assignee);
  } catch (error) {
    if (error instanceof z.ZodError || (error as any).name === 'ZodError') {
      return NextResponse.json({ error: "入力内容に不備があります", details: (error as any).errors }, { status: 400 });
    }
    console.error("POST /api/assignees error:", error);
    return NextResponse.json({ error: "登録に失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
