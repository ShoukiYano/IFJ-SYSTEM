export const dynamic = "force-dynamic";

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

    // 見積書取得 (テナントチェック込み)
    const quotation = await prisma.quotation.findFirst({
      where: {
        id: params.id,
        tenantId: context.tenantId
      },
      include: { items: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "見積書が見つかりません" }, { status: 404 });
    }

    if (quotation.status === "INVOICED") {
      return NextResponse.json({ error: "既に請求書に変換済みです" }, { status: 400 });
    }

    // 請求書採番 (テナント固有)
    const sequence = await prisma.invoiceSequence.upsert({
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
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    const invoiceNumber = `${sequence.prefix}${yearMonth}-${sequence.current.toString().padStart(4, "0")}`;

    // 請求書作成
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          tenantId: context.tenantId,
          invoiceNumber,
          clientId: quotation.clientId,
          issueDate: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // デフォルト30日後
          subject: quotation.subject,
          templateType: quotation.templateType as any,
          notes: quotation.notes,
          taxRate: quotation.taxRate,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          items: {
            create: quotation.items.map((item: any) => ({
              description: item.description,
              serviceMonth: item.serviceMonth,
              personName: item.personName,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              amount: item.amount,
              minHours: item.minHours,
              maxHours: item.maxHours,
              overtimeRate: item.overtimeRate,
              deductionRate: item.deductionRate,
              overtimeAmount: item.overtimeAmount,
              deductionAmount: item.deductionAmount,
              order: item.order,
              staffId: item.staffId,
            })),
          },
        },
      });

      // 見積書ステータス更新
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: "INVOICED",
          invoiceId: inv.id
        },
      });

      return inv;
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Quotation convert error:", error);
    return NextResponse.json({ error: "変換に失敗しました" }, { status: 500 });
  }
}
