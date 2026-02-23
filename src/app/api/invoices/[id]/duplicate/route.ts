import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 获取原始发票及其明细
    // Get original invoice and its items
    const original = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!original) {
      return NextResponse.json({ error: "請求書が見つかりません" }, { status: 404 });
    }

    // 作成中、または下書き状態の新しい請求書番号を生成するために、
    // 既存の採番ロジックに準拠するか、空にしてユーザーに振ってもらう形式にする。
    // ここではコピーであることを示すために番号をリセットし、日付もクリアする。
    
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
        invoiceNumber: `COPY-${original.invoiceNumber}-${Date.now()}`, // Temporary number
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
