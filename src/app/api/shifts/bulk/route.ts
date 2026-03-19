import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfDay, format } from "date-fns";

export async function POST(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { tenantId, role } = context;

    const body = await req.json();
    const { shifts } = body;
    if (!Array.isArray(shifts)) {
      return NextResponse.json({ error: "無効なデータ形式です" }, { status: 400 });
    }

    // 一般ユーザーはシフトの新規登録のみ許可。変更・削除は申請が必要
    if (role === "TENANT_USER") {
      const staff = await (prisma as any).staff.findUnique({
        where: { userId: context.userId }
      });
      if (!staff) return NextResponse.json({ error: "スタッフ情報が見つかりません" }, { status: 404 });

      for (const s of shifts) {
        // 自分自身（UUID または "current-user" 別名）以外はエラー
        if (s.staffId !== staff.id && s.staffId !== "current-user") {
          return NextResponse.json({ error: "他人のシフトは操作できません" }, { status: 403 });
        }
        
        // 処理のために本物のスタッフIDに統一する
        s.staffId = staff.id;

        if (s.isDeleted) {
          return NextResponse.json({ error: "削除には申請が必要です" }, { status: 403 });
        }

        // 既存シフトの有無に関わらず、自分のシフトであれば上書き（Upsert）を許可する
      }
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
