import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, subMonths, format } from "date-fns";

export async function POST(req: Request) {
  try {
    const { targetMonth } = await req.json(); // e.g., "2024-09"
    
    if (!targetMonth) {
      return NextResponse.json({ error: "対象月を指定してください" }, { status: 400 });
    }

    // 1. 全取引先を取得
    const clients = await prisma.client.findMany();
    
    let createdCount = 0;
    const errors: string[] = [];

    for (const client of clients) {
      // 2. その取引先の最新の請求書を探す
      const latestInvoice = await prisma.invoice.findFirst({
        where: { clientId: client.id },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });

      if (!latestInvoice) continue;

      // 3. 複製データを作成
      const monthOnly = targetMonth.split('-')[1].replace(/^0/, '');
      const { id: _, invoiceNumber: __, createdAt: ___, updatedAt: ____, items: itemsList, ...invoiceData } = latestInvoice as any;
      const newItems = itemsList.map(({ id: _____, invoiceId: ______, ...itemData }: any) => ({
        ...itemData,
        // SESの場合、年月と内容を更新
        serviceMonth: (latestInvoice as any).templateType === "SES" ? `${targetMonth.replace('-', '年')}月` : itemData.serviceMonth,
        description: (latestInvoice as any).templateType === "SES" ? `${monthOnly}月度稼働分` : itemData.description,
      }));

      try {
        await prisma.invoice.create({
          data: {
            ...invoiceData,
            clientId: client.id,
            invoiceNumber: `BULK-${client.id.slice(0,4)}-${Date.now()}`, // Temporary
            status: "DRAFT",
            issueDate: new Date(),
            dueDate: null,
            items: {
              create: newItems,
            },
          },
        });
        createdCount++;
      } catch (err: any) {
        errors.push(`${client.name}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      message: `${createdCount}件の請求書を作成しました。`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error("Bulk generate error:", error);
    return NextResponse.json({ error: error.message || "一括作成に失敗しました" }, { status: 500 });
  }
}
