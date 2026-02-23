import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  serviceMonth: z.string().optional().nullable(),
  personName: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0),
  unit: z.string().optional().nullable().transform(v => v === null ? undefined : v),
  unitPrice: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
  minHours: z.coerce.number().optional().nullable(),
  maxHours: z.coerce.number().optional().nullable(),
  overtimeRate: z.coerce.number().optional().nullable(),
  deductionRate: z.coerce.number().optional().nullable(),
  overtimeAmount: z.coerce.number().optional().nullable(),
  deductionAmount: z.coerce.number().optional().nullable(),
});

const invoiceSchema = z.object({
  clientId: z.string().uuid(),
  invoiceNumber: z.string().optional().nullable(),
  issueDate: z.string(),
  dueDate: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  templateType: z.enum(["STANDARD", "SES"]).default("STANDARD"),
  notes: z.string().optional().nullable(),
  taxRate: z.coerce.number().default(0.1),
  items: z.array(invoiceItemSchema).min(1),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const month = searchParams.get("month"); // YYYY-MM
  const minDate = searchParams.get("minDate");
  const maxDate = searchParams.get("maxDate");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");

  try {
    const where: any = { deletedAt: null };
    if (clientId) where.clientId = clientId;
    
    if (month) {
      const [year, m] = month.split("-").map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 1);
      where.issueDate = {
        gte: startDate,
        lt: endDate,
      };
    } else if (minDate || maxDate) {
      where.issueDate = {};
      if (minDate) where.issueDate.gte = new Date(minDate);
      if (maxDate) where.issueDate.lte = new Date(maxDate);
    }

    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = Number(minAmount);
      if (maxAmount) where.totalAmount.lte = Number(maxAmount);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { client: true, items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = invoiceSchema.parse(body);

    // 採番管理 (invoiceNumber が指定されていない場合のみ)
    let invoiceNumber = validated.invoiceNumber;
    if (!invoiceNumber) {
      const sequence = await prisma.invoiceSequence.upsert({
        where: { id: "default" },
        update: { current: { increment: 1 } },
        create: { id: "default", current: 1 },
      });

      const date = new Date(validated.issueDate);
      const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      invoiceNumber = `INV-${yearMonth}-${sequence.current.toString().padStart(4, "0")}`;
    }

    const subtotal = validated.items.reduce((acc, item) => acc + item.amount, 0);
    const taxAmount = Math.floor(subtotal * validated.taxRate);
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        issueDate: validated.issueDate ? new Date(validated.issueDate) : new Date(),
        dueDate: (validated.dueDate && !isNaN(Date.parse(validated.dueDate))) ? new Date(validated.dueDate) : null,
        subject: validated.subject,
        // @ts-ignore
        registrationNumber: validated.registrationNumber,
        templateType: validated.templateType as any,
        notes: validated.notes,
        taxRate: Number(validated.taxRate),
        totalAmount,
        taxAmount,
        clientId: validated.clientId,
        items: {
          create: validated.items.map((item, index) => ({
            ...item,
            order: index,
          })),
        },
      },
      include: { items: true, client: true },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError || (error as any).name === 'ZodError') {
      return NextResponse.json({ error: "入力内容に不備があります", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "作成に失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
