import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const assigneeUpdateSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const validated = assigneeUpdateSchema.parse(body);

    // @ts-ignore
    const updated = await prisma.assignee.update({
      where: { id },
      data: {
        ...validated,
        contractStartDate: validated.contractStartDate ? new Date(validated.contractStartDate) : null,
        contractEndDate: validated.contractEndDate ? new Date(validated.contractEndDate) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError || (error as any).name === 'ZodError') {
      return NextResponse.json({ error: "入力内容に不備があります", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // @ts-ignore
    await prisma.assignee.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
