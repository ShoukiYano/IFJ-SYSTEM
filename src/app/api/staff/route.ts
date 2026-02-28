import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getTenantContext } from "@/lib/tenantContext";

const staffSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  type: z.enum(["PROPER", "BP"]),
  area: z.enum(["KANSAI", "KANTO"]),
  manager: z.string().optional().nullable(),
  clientId: z.string().uuid("無効な取引先IDです"),
  unitPrice: z.number().min(0, "単価は0以上である必要があります"),
  minHours: z.number().optional().nullable(),
  maxHours: z.number().optional().nullable(),
  contractStartDate: z.string().optional().nullable(),
  renewalInterval: z.number().min(1).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const staffs = await (prisma as any).staff.findMany({
      where: {
        tenantId: context.tenantId,
        deletedAt: null,
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staffs);
  } catch (error) {
    console.error("GET /api/staff error:", error);
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
    const validated = staffSchema.parse(body);

    const staff = await (prisma as any).staff.create({
      data: {
        ...validated,
        contractStartDate: validated.contractStartDate ? new Date(validated.contractStartDate) : null,
        tenantId: context.tenantId,
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "入力内容に不備があります", details: error.errors }, { status: 400 });
    }
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ error: "登録に失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
