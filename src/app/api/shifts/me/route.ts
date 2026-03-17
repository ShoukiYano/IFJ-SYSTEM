export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { userId, tenantId } = context;

    // Staff 特定
    const staff = await (prisma as any).staff.findFirst({
      where: { userId, tenantId, deletedAt: null }
    });

    if (!staff) {
      return NextResponse.json({ error: "従業員情報が見つかりません" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("start");
    
    const startDate = startParam ? new Date(startParam) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = addDays(startDate, 7);

    const shifts = await (prisma as any).shift.findMany({
      where: {
        staffId: staff.id,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { date: "asc" }
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error("GET /api/shifts/me error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
