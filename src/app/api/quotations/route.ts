import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const quotationItemSchema = z.object({
  description: z.string().min(1),
  serviceMonth: z.string().optional().nullable(),
  personName: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0),
  unit: z.string().optional().nullable().default("式").transform(v => v === null ? undefined : v),
  unitPrice: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
  minHours: z.coerce.number().optional().nullable(),
  maxHours: z.coerce.number().optional().nullable(),
  overtimeRate: z.coerce.number().optional().nullable(),
  deductionRate: z.coerce.number().optional().nullable(),
  overtimeAmount: z.coerce.number().optional().nullable(),
  deductionAmount: z.coerce.number().optional().nullable(),
});

const quotationSchema = z.object({
  clientId: z.string().uuid(),
  quotationNumber: z.string().optional().nullable(),
  issueDate: z.string(),
  expiryDate: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  templateType: z.enum(["STANDARD", "SES"]).default("STANDARD"),
  notes: z.string().optional().nullable(),
  taxRate: z.coerce.number().default(0.10),
  items: z.array(quotationItemSchema).min(1),
});

export async function GET() {
  try {
    const quotations = await prisma.quotation.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotations);
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = quotationSchema.parse(body);

    // 採番管理 (quotationNumber が指定されていない場合のみ)
    let quotationNumber = validated.quotationNumber;
    if (!quotationNumber) {
      const sequence = await prisma.invoiceSequence.upsert({
        where: { id: "quotation" },
        update: { current: { increment: 1 } },
        create: { id: "quotation", prefix: "EST-", current: 1 },
      });

      const date = new Date(validated.issueDate);
      const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      quotationNumber = `${sequence.prefix}${yearMonth}-${sequence.current.toString().padStart(4, "0")}`;
    }

    const subtotal = validated.items.reduce((acc, item) => acc + item.amount, 0);
    const taxAmount = Math.floor(subtotal * validated.taxRate);
    const totalAmount = subtotal + taxAmount;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        clientId: validated.clientId,
        issueDate: new Date(validated.issueDate),
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        subject: validated.subject,
        // @ts-ignore
        registrationNumber: validated.registrationNumber,
        templateType: validated.templateType as any,
        notes: validated.notes,
        taxRate: Number(validated.taxRate),
        taxAmount,
        totalAmount,
        items: {
          create: validated.items.map((item, index) => ({
            ...item,
            order: index,
          })),
        },
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
