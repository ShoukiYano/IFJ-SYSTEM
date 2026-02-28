import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function POST(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { targetMonth } = await req.json(); // e.g., "2024-09"
    
    if (!targetMonth) {
      return NextResponse.json({ error: "対象月を指定してください" }, { status: 400 });
    }

    // 1. そのテナントの全取引先を取得
    const clients = await prisma.client.findMany({
      where: { tenantId: context.tenantId }
    });
    
    let createdCount = 0;
    const errors: string[] = [];

    // トランザクションでバッチ処理
    await prisma.$transaction(async (tx) => {
      for (const client of clients) {
        // 2. その取引先の最新の請求書を探す
        const latestInvoice = await tx.invoice.findFirst({
          where: { 
            tenantId: context.tenantId,
            clientId: client.id 
          },
          orderBy: { createdAt: "desc" },
          include: { items: true },
        });

        if (!latestInvoice) continue;

        // 3. 複製データを作成
        const monthOnly = targetMonth.split('-')[1].replace(/^0/, '');
        const { id: _, invoiceNumber: __, createdAt: ___, updatedAt: ____, items: itemsList, ...invoiceData } = latestInvoice as any;
        
        // 採番 (テナント固有)
        const sequence = await tx.invoiceSequence.upsert({
          where: { 
            tenantId_id: {
              tenantId: context.tenantId,
              id: "default"
            }
          },
          update: { current: { increment: 1 } },
          create: { 
            id: "default", 
            tenantId: context.tenantId,
            current: 1 
          },
        });

        const date = new Date();
        const yearMonthStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
        const invoiceNumber = `${sequence.prefix}${yearMonthStr}-${sequence.current.toString().padStart(4, "0")}`;

        const newItems = itemsList.map(({ id: _____, invoiceId: ______, ...itemData }: any) => ({
          ...itemData,
          serviceMonth: (latestInvoice as any).templateType === "SES" ? `${targetMonth.replace('-', '年')}月` : itemData.serviceMonth,
          description: (latestInvoice as any).templateType === "SES" ? `${monthOnly}月度稼働分` : itemData.description,
        }));

        await tx.invoice.create({
          data: {
            ...invoiceData,
            tenantId: context.tenantId,
            clientId: client.id,
            invoiceNumber,
            status: "DRAFT",
            issueDate: new Date(),
            dueDate: null,
            items: {
              create: newItems,
            },
          },
        });
        createdCount++;
      }
    });

    return NextResponse.json({ 
      message: `${createdCount}件の請求書を作成しました。`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error("Bulk generate error:", error);
    return NextResponse.json({ error: error.message || "一括作成に失敗しました" }, { status: 500 });
  }
}
