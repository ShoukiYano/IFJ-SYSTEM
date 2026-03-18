export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { tenantId, role } = context;
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    if (!startStr || !endStr) {
      return NextResponse.json({ error: "期間指定が必要です" }, { status: 400 });
    }

    let where: any = {
      tenantId,
      date: {
        gte: new Date(startStr),
        lte: new Date(endStr)
      }
    };

    if (role === "TENANT_USER") {
      const staff = await (prisma as any).staff.findUnique({
        where: { userId: context.userId }
      });
      if (!staff) {
        return NextResponse.json({ error: "スタッフ情報が見つかりません" }, { status: 404 });
      }
      where.staffId = staff.id;
    }

    const shifts = await (prisma as any).shift.findMany({
      where,
      orderBy: { date: "asc" }
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error("GET /api/shifts error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
