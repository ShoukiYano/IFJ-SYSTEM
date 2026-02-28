import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function PATCH(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { ids, status } = await req.json();

    if (!Array.isArray(ids) || !status) {
      return NextResponse.json({ error: "不正なパラメータです" }, { status: 400 });
    }

    await prisma.quotation.updateMany({
      where: {
        id: { in: ids },
        tenantId: context.tenantId
      },
      data: {
        status,
      },
    });

    return NextResponse.json({ message: "更新が完了しました" });
  } catch (error) {
    console.error("Quotation bulk update error:", error);
    return NextResponse.json({ error: "一括更新に失敗しました" }, { status: 500 });
  }
}
