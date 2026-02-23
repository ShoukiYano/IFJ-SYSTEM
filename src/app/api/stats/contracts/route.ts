import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addMonths } from "date-fns";

export async function GET() {
  try {
    const twoMonthsLater = addMonths(new Date(), 2);

    // @ts-ignore
    const expiringContracts = await prisma.assignee.findMany({
      where: {
        contractEndDate: {
          lte: twoMonthsLater,
          gte: new Date(), // Only focus on future expirations (or very recent ones)
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
