import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const id = params.id;

    // Ensure ownership before duplicating
    const original = await prisma.invoice.findFirst({
      where: { 
        id,
        tenantId: context.tenantId 
      },
      include: { items: true },
    });

    if (!original) {
      return NextResponse.json({ error: "請求書が見つかりません" }, { status: 404 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthName = `${currentYear}年${String(currentMonth).padStart(2, '0')}月`;
    const currentMonthDesc = `${currentMonth}月度稼働分`;

    const { id: _, invoiceNumber: __, createdAt: ___, updatedAt: ____, items, ...invoiceData } = original as any;

    const newItems = items.map(({ id: _____, invoiceId: ______, ...itemData }: any) => ({
      ...itemData,
      serviceMonth: (original as any).templateType === "SES" ? currentMonthName : itemData.serviceMonth,
      description: (original as any).templateType === "SES" ? currentMonthDesc : itemData.description,
    }));

    const duplicated = await prisma.invoice.create({
      data: {
        ...invoiceData,
        tenantId: context.tenantId,
        invoiceNumber: `COPY-${original.invoiceNumber}-${Date.now()}`, 
        status: "DRAFT",
        issueDate: new Date(),
        dueDate: null,
        items: {
          create: newItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(duplicated);
  } catch (error: any) {
    console.error("Duplicate error:", error);
    return NextResponse.json({ error: error.message || "複製に失敗しました" }, { status: 500 });
  }
}
