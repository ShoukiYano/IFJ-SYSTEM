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

    const { tenantId } = context;
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    if (!startStr || !endStr) {
      return NextResponse.json({ error: "期間指定が必要です" }, { status: 400 });
    }

    const shifts = await (prisma as any).shift.findMany({
      where: {
        tenantId,
        date: {
          gte: new Date(startStr),
          lte: new Date(endStr)
        }
      }
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error("GET /api/shifts error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
