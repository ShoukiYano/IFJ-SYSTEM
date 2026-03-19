import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfMonth, endOfMonth, format, differenceInMinutes } from "date-fns";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context || context.role === "TENANT_USER") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { tenantId } = context;
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    const month = searchParams.get("month"); // "2024-03"

    if (!staffId || !month) {
      return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
    }

    const rangeStart = startOfMonth(new Date(month + "-01"));
    const rangeEnd = endOfMonth(new Date(month + "-01"));

    const staff = await (prisma as any).staff.findUnique({
      where: { id: staffId },
      include: { client: true }
    });

    if (!staff) {
      return NextResponse.json({ error: "スタッフが見つかりません" }, { status: 404 });
    }

    const records = await (prisma as any).attendanceRecord.findMany({
      where: {
        tenantId,
        staffId,
        date: { gte: rangeStart, lte: rangeEnd },
        status: "APPROVED"
      },
      orderBy: { date: "asc" }
    });

    // CSV Header: UTF-8 with BOM for Excel compatibility
    let csvContent = "\uFEFF"; 
    csvContent += "従業員名,客先,日付,出勤,退勤,休憩(分),実働時間(時)\n";

    records.forEach((r: any) => {
      const clockIn = r.clockIn ? format(new Date(r.clockIn), "HH:mm") : "-";
      const clockOut = r.clockOut ? format(new Date(r.clockOut), "HH:mm") : "-";
      const breakMin = r.breakMinutes || 60;
      
      let workHours = "0.00";
      if (r.clockIn && r.clockOut) {
        const diff = differenceInMinutes(new Date(r.clockOut), new Date(r.clockIn)) - breakMin;
        workHours = (Math.max(0, diff) / 60).toFixed(2);
      }

      const row = [
        staff.name,
        staff.client?.name || "-",
        format(new Date(r.date), "yyyy/MM/dd"),
        clockIn,
        clockOut,
        breakMin,
        workHours
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
      
      csvContent += row + "\n";
    });

    const fileName = `attendance_${encodeURIComponent(staff.name)}_${month}.csv`;

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${fileName}`
      }
    });

  } catch (error) {
    console.error("GET /api/attendance/summary/export error:", error);
    return NextResponse.json({ error: "出力に失敗しました" }, { status: 500 });
  }
}
