import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const assigneeSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  clientId: z.string().uuid("無効な取引先IDです"),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientIdが必要です" }, { status: 400 });
    }

    // @ts-ignore
    const assignees = await prisma.assignee.findMany({
      where: { clientId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(assignees);
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = assigneeSchema.parse(body);

    // @ts-ignore
    const assignee = await prisma.assignee.create({
      data: {
        ...validated,
        contractStartDate: validated.contractStartDate ? new Date(validated.contractStartDate) : null,
        contractEndDate: validated.contractEndDate ? new Date(validated.contractEndDate) : null,
      },
    });

    return NextResponse.json(assignee);
  } catch (error) {
    if (error instanceof z.ZodError || (error as any).name === 'ZodError') {
      return NextResponse.json({ error: "入力内容に不備があります", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "登録に失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
