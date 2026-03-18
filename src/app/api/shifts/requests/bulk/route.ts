import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay } from "date-fns";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const body = await req.json().catch(() => ({}));
  const { requests } = body;

  if (!Array.isArray(requests) || requests.length === 0) {
    return NextResponse.json({ error: "無効なデータ形式です" }, { status: 400 });
  }

  try {
    // staffId の特定
    const staff = await (prisma as any).staff.findUnique({
      where: { userId: user.id }
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    // トランザクションで一括作成
    const result = await (prisma as any).$transaction(
      requests.map((r: any) => {
        const dateObj = new Date(r.targetDate);
        return (prisma as any).shiftChangeRequest.create({
          data: {
            tenantId: user.tenantId,
            staffId: staff.id,
            targetDate: startOfDay(dateObj),
            currentStartTime: r.currentStartTime ? new Date(r.currentStartTime) : null,
            currentEndTime: r.currentEndTime ? new Date(r.currentEndTime) : null,
            requestStartTime: new Date(r.requestStartTime),
            requestEndTime: new Date(r.requestEndTime),
            reason: r.reason,
            status: "PENDING"
          }
        });
      })
    );

    return NextResponse.json({ message: `${result.length}件の申請を送信しました`, count: result.length });
  } catch (error) {
    console.error("POST /api/shifts/requests/bulk error:", error);
    return NextResponse.json({ error: "一括申請の送信に失敗しました" }, { status: 500 });
  }
}
