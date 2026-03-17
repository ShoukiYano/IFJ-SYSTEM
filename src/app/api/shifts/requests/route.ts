import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay } from "date-fns";

// GET: 自分の申請履歴または未処理の申請一覧を取得
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const where: any = {
      tenantId: user.tenantId,
    };

    // SYSTEM_ADMIN / TENANT_ADMIN は全申請を見れる
    // TENANT_USER は自分の申請のみ
    if (user.role === "TENANT_USER") {
      // 自分の staffId を取得
      const staff = await (prisma as any).staff.findUnique({
        where: { userId: user.id }
      });
      if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
      where.staffId = staff.id;
    }

    if (status) {
      where.status = status;
    }

    const requests = await (prisma as any).shiftChangeRequest.findMany({
      where,
      include: {
        staff: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: シフト変更申請の提出
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const body = await req.json().catch(() => ({}));
  const { targetDate, requestStartTime, requestEndTime, reason } = body;

  if (!targetDate || !requestStartTime || !requestEndTime || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // staffId の特定
    const staff = await (prisma as any).staff.findUnique({
      where: { userId: user.id }
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    const dateObj = new Date(targetDate);
    
    // 現在のシフト情報を取得（あれば）
    const currentShift = await (prisma as any).shift.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: startOfDay(dateObj)
        }
      }
    });

    const request = await (prisma as any).shiftChangeRequest.create({
      data: {
        tenantId: user.tenantId,
        staffId: staff.id,
        targetDate: startOfDay(dateObj),
        currentStartTime: currentShift?.startTime || null,
        currentEndTime: currentShift?.endTime || null,
        requestStartTime: new Date(requestStartTime),
        requestEndTime: new Date(requestEndTime),
        reason,
        status: "PENDING"
      }
    });

    return NextResponse.json(request);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
