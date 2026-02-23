import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { ids, status } = await req.json();

    if (!Array.isArray(ids) || !status) {
      return NextResponse.json({ error: "不正なパラメータです" }, { status: 400 });
    }

    await prisma.invoice.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status,
      },
    });

    return NextResponse.json({ message: "更新が完了しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "一括更新に失敗しました" }, { status: 500 });
  }
}
