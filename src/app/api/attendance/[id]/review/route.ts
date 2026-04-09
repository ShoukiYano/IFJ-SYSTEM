import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { tenantId, userId } = context;
    const { id } = await params; // AttendanceRecord ID
    const body = await req.json();
    const { status, note } = body; // APPROVED or REMANDED

    if (!["APPROVED", "REMANDED"].includes(status)) {
      return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
    }

    // 1. 打刻レコードの存在確認
    const record = await (prisma as any).attendanceRecord.findUnique({
      where: { id },
    });

    if (!record || record.tenantId !== tenantId) {
      return NextResponse.json({ error: "レコードが見つかりません" }, { status: 404 });
    }

    // 2. 更新
    const updatedRecord = await (prisma as any).attendanceRecord.update({
      where: { id },
      data: {
        status,
        updatedBy: userId,
        // 差戻し時はメモを更新する場合など
        note: status === "REMANDED" && note ? note : record.note
      }
    });

    return NextResponse.json({ message: "ステータスを更新しました", record: updatedRecord });

  } catch (error) {
    console.error("PATCH /api/attendance/[id]/review error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
