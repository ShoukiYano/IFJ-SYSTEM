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

    // 管理者権限チェック
    if (role === "TENANT_USER") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ error: "期間指定が必要です" }, { status: 400 });
    }

    const records = await (prisma as any).attendanceRecord.findMany({
      where: {
        tenantId,
        date: {
          gte: new Date(start),
          lte: new Date(end)
        }
      },
      select: {
        id: true,
        staffId: true,
        date: true,
        clockIn: true,
        clockOut: true,
        status: true
      }
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("GET /api/attendance/bulk error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
