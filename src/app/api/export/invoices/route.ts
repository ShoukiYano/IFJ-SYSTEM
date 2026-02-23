import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
      },
      orderBy: { issueDate: "desc" },
    });

    const headers = [
      "請求書番号",
      "件名",
      "取引先",
      "発行日",
      "支払期限",
      "ステータス",
      "金額(税抜)",
      "消費税",
      "合計金額(税込)",
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.subject || "",
      inv.client.name,
      format(new Date(inv.issueDate), "yyyy/MM/dd"),
      inv.dueDate ? format(new Date(inv.dueDate), "yyyy/MM/dd") : "",
      inv.status,
      Number(inv.totalAmount) - Number(inv.taxAmount),
      Number(inv.taxAmount),
      Number(inv.totalAmount),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    // Add BOM for Excel compatibility in Japanese
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const response = new NextResponse(Buffer.concat([bom, Buffer.from(csvContent)]));

    response.headers.set("Content-Type", "text/csv; charset=utf-8");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="invoices_export_${format(new Date(), "yyyyMMdd")}.csv"`
    );

    return response;
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "エクスポートに失敗しました" }, { status: 500 });
  }
}
