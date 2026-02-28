import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getTenantContext } from "@/lib/tenantContext";

const staffUpdateSchema = z.object({
  name: z.string().min(1, "名前は必須です").optional(),
  type: z.enum(["PROPER", "BP"]).optional(),
  area: z.enum(["KANSAI", "KANTO"]).optional(),
  manager: z.string().optional().nullable(),
  clientId: z.string().uuid("無効な取引先IDです").optional(),
  unitPrice: z.number().min(0, "単価は0以上である必要があります").optional(),
  minHours: z.number().optional().nullable(),
  maxHours: z.number().optional().nullable(),
  contractStartDate: z.string().optional().nullable(),
  renewalInterval: z.number().min(1).optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  settlementUnit: z.number().optional().nullable(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const staff = await (prisma as any).staff.findUnique({
      where: {
        tenantId_id: {
          id: params.id,
          tenantId: context.tenantId
        }
      },
      include: { client: true },
    });

    if (!staff || staff.deletedAt) {
      return NextResponse.json({ error: "要員が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("GET /api/staff/[id] error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    const validated = staffUpdateSchema.parse(body);

    const staff = await (prisma as any).staff.update({
      where: {
        tenantId_id: {
          id: params.id,
          tenantId: context.tenantId
        }
      },
      data: {
        ...validated,
        contractStartDate: validated.contractStartDate ? new Date(validated.contractStartDate) : (validated.contractStartDate === null ? null : undefined),
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "入力内容に不備があります", details: error.errors }, { status: 400 });
    }
    console.error("PATCH /api/staff/[id] error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Soft delete with tenant check
    await (prisma as any).staff.update({
      where: {
        tenantId_id: {
          id: params.id,
          tenantId: context.tenantId
        }
      },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("DELETE /api/staff/[id] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
