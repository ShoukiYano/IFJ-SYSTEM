import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH: 申請の承認・棄却
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role === "TENANT_USER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const { status, rejectionReason } = body;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const request = await (prisma as any).shiftChangeRequest.findUnique({
      where: { id, tenantId: user.tenantId }
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const updatedRequest = await (prisma as any).shiftChangeRequest.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewerId: user.id,
        reviewedAt: new Date()
      }
    });

    // 承認された場合、Shift レコードを更新または作成
    if (status === "APPROVED") {
      await (prisma as any).shift.upsert({
        where: {
          staffId_date: {
            staffId: request.staffId,
            date: request.targetDate
          }
        },
        create: {
          tenantId: request.tenantId,
          staffId: request.staffId,
          date: request.targetDate,
          startTime: request.requestStartTime,
          endTime: request.requestEndTime,
          type: "WORKING"
        },
        update: {
          startTime: request.requestStartTime,
          endTime: request.requestEndTime,
          type: "WORKING"
        }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
