import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfDay } from "date-fns";

export async function POST(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { tenantId } = context;
    const body = await req.json();
    const { shifts } = body; // Array of { staffId, date, startTime, endTime, type }

    if (!Array.isArray(shifts)) {
      return NextResponse.json({ error: "無効なデータ形式です" }, { status: 400 });
    }

    // トランザクションで一括処理
    const results = await (prisma as any).$transaction(
      shifts.map((s: any) => {
        const date = startOfDay(new Date(s.date));
        if (s.isDeleted) {
          return (prisma as any).shift.deleteMany({
            where: {
              staffId: s.staffId,
              date: date,
              tenantId: tenantId
            }
          });
        }
        return (prisma as any).shift.upsert({
          where: {
            staffId_date: {
              staffId: s.staffId,
              date: date,
            }
          },
          create: {
            tenantId,
            staffId: s.staffId,
            date: date,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            type: s.type || "WORKING"
          },
          update: {
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            type: s.type || "WORKING"
          }
        });
      })
    );

    return NextResponse.json({ message: `${results.length}件のシフトを処理しました`, results });

  } catch (error) {
    console.error("POST /api/shifts/bulk error:", error);
    return NextResponse.json({ error: "シフトの登録に失敗しました" }, { status: 500 });
  }
}
