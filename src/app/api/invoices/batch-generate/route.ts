import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { targetMonth } = await req.json(); // "YYYY-MM"
    if (!targetMonth) {
      return NextResponse.json({ error: "対象年月は必須です" }, { status: 400 });
    }

    const [year, month] = targetMonth.split("-").map(Number);
    
    // 1. 定型請求対象の全取引先を取得
    const clients = await prisma.client.findMany({
      where: { 
        isRecurring: true,
        deletedAt: null 
      }
    } as any);

    let count = 0;

    // トランザクションで処理
    await prisma.$transaction(async (tx) => {
      for (const client of clients) {
        // 2. この取引先の最新の請求書を取得 (コピー元)
        const lastInvoice = await tx.invoice.findFirst({
          where: { clientId: client.id, deletedAt: null },
          orderBy: { issueDate: "desc" },
          include: { items: true }
        });

        if (!lastInvoice) continue;

        // 3. 発行日を設定 (指定月の25日をデフォルトとする)
        const issueDate = new Date(year, month - 1, 25);

        // 4. 支払期日を計算
        // 締め日設定に基づき、その月の末尾などを考慮
        const closingDate = new Date(year, month - 1, client.closingDay || 31);
        if (client.closingDay === 31) {
          closingDate.setMonth(closingDate.getMonth() + 1);
          closingDate.setDate(0);
        }

        const dueDate = new Date(closingDate);
        dueDate.setMonth(dueDate.getMonth() + (client.paymentMonthOffset || 0));
        dueDate.setDate(client.paymentDay || 31);
        if (client.paymentDay === 31) {
          dueDate.setMonth(dueDate.getMonth() + 1);
          dueDate.setDate(0);
        }

        // 5. 採番
        const sequence = await tx.invoiceSequence.upsert({
          where: { id: "default" },
          update: { current: { increment: 1 } },
          create: { id: "default", current: 1 },
        });

        const yearMonthStr = `${year}${month.toString().padStart(2, "0")}`;
        const invoiceNumber = `INV-${yearMonthStr}-${sequence.current.toString().padStart(4, "0")}`;

        // 6. メインの請求書データ作成
        const subtotal = lastInvoice.items.reduce((acc, item) => acc + Number(item.amount), 0);
        const taxAmount = Math.floor(subtotal * Number(lastInvoice.taxRate));
        const totalAmount = subtotal + taxAmount;

        const newInvoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            issueDate,
            dueDate,
            subject: lastInvoice.subject,
            registrationNumber: lastInvoice.registrationNumber,
            status: "DRAFT",
            templateType: lastInvoice.templateType,
            notes: lastInvoice.notes,
            taxRate: lastInvoice.taxRate,
            totalAmount,
            taxAmount,
            clientId: client.id,
            items: {
              create: lastInvoice.items.map((item, index) => {
                // 明細のサービス年月を更新
                const newServiceMonth = `${year}-${month.toString().padStart(2, "0")}`;
                let newDescription = item.description;
                
                // "X月度" という表現が含まれていれば置換
                if (newDescription.includes("月度")) {
                  newDescription = newDescription.replace(/\d+月度/, `${month}月度`);
                }

                return {
                  description: newDescription,
                  serviceMonth: newServiceMonth,
                  personName: item.personName,
                  quantity: item.quantity,
                  unit: item.unit,
                  unitPrice: item.unitPrice,
                  amount: item.amount,
                  minHours: item.minHours,
                  minHours2: item.minHours2,
                  maxHours: item.maxHours,
                  maxHours2: item.maxHours2,
                  overtimeRate: item.overtimeRate,
                  overtimeRate2: item.overtimeRate2,
                  deductionRate: item.deductionRate,
                  deductionRate2: item.deductionRate2,
                  overtimeAmount: 0, // 下書きなので精算額はリセット
                  overtimeAmount2: 0,
                  deductionAmount: 0,
                  deductionAmount2: 0,
                  order: index,
                };
              })
            }
          }
        });
        count++;
      }
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Batch generate error:", error);
    return NextResponse.json({ error: "一括生成に失敗しました", details: String(error) }, { status: 500 });
  }
}
