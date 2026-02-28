import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function GET() {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 過去6ヶ月分の売上を取得
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: context.tenantId,
        deletedAt: null,
        issueDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        issueDate: true,
        totalAmount: true,
      },
    });

    // 月ごとに集計
    const monthlySales: { [key: string]: number } = {};
    
    // 過去6ヶ月のキーを初期化
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      monthlySales[key] = 0;
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.issueDate);
      const key = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      if (monthlySales[key] !== undefined) {
        monthlySales[key] += Number(inv.totalAmount);
      }
    });

    // Recharts 用の形式に変換 (昇順)
    const data = Object.entries(monthlySales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/stats/sales error:", error);
    return NextResponse.json({ error: "統計の取得に失敗しました" }, { status: 500 });
  }
}
