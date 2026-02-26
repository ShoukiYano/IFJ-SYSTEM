import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "会社名は必須です"),
  department: z.string().optional(),
  manager: z.string().optional(),
  honorific: z.string().default("御中"),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  tel: z.string().optional(),
  email: z.string().email("無効なメール形式です").optional().or(z.literal("")),
  closingDay: z.number().min(1).max(31).default(31),
  paymentMonthOffset: z.number().min(0).max(2).default(1),
  paymentDay: z.number().min(1).max(31).default(31),
  isRecurring: z.boolean().default(false),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const recurringOnly = searchParams.get("recurringOnly") === "true";

    const clients = await prisma.client.findMany({
      where: { 
        deletedAt: null,
        ...(recurringOnly ? { isRecurring: true } : {}),
      } as any,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = clientSchema.parse(body);
    const client = await prisma.client.create({
      data: validated,
    });
    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof z.ZodError || (error as any).name === 'ZodError') {
      return NextResponse.json({ error: "入力内容に不備があります", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "登録に失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
