import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientIdが必要です" }, { status: 400 });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: context.tenantId,
        clientId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3, // 直近3件の平均
      select: {
        totalAmount: true,
      },
    });

    if (invoices.length === 0) {
      return NextResponse.json({ average: 0 });
    }

    const sum = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
    const average = sum / invoices.length;

    return NextResponse.json({ average });
  } catch (error) {
    console.error("GET /api/stats/average error:", error);
    return NextResponse.json({ error: "統計の取得に失敗しました" }, { status: 500 });
  }
}
