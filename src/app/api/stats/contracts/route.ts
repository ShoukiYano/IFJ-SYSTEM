import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addMonths } from "date-fns";
import { getTenantContext } from "@/lib/tenantContext";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const twoMonthsLater = addMonths(new Date(), 2);

    const expiringContracts = await prisma.assignee.findMany({
      where: {
        tenantId: context.tenantId,
        contractEndDate: {
          lte: twoMonthsLater,
          gte: new Date(),
        },
      },
      include: {
        client: true,
      },
      orderBy: {
        contractEndDate: "asc",
      },
    });

    return NextResponse.json(expiringContracts);
  } catch (error) {
    console.error("Fetch expiring contracts error:", error);
    return NextResponse.json({ error: "契約データの取得に失敗しました" }, { status: 500 });
  }
}
