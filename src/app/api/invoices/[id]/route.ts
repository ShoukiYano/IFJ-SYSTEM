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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { 
        client: true,
        items: {
          orderBy: { order: "asc" }
        }
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "請求書が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = invoiceSchema.parse(body);

    const subtotal = validated.items.reduce((acc, item) => acc + item.amount, 0);
    const taxAmount = Math.floor(subtotal * validated.taxRate);
    const totalAmount = subtotal + taxAmount;

    const result = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id }
      });

      // Update invoice
      return tx.invoice.update({
        where: { id: params.id },
        data: {
          invoiceNumber: validated.invoiceNumber || undefined,
          issueDate: new Date(validated.issueDate),
          dueDate: (validated.dueDate && !isNaN(Date.parse(validated.dueDate))) ? new Date(validated.dueDate) : null,
          subject: validated.subject,
          // @ts-ignore
          registrationNumber: validated.registrationNumber,
          templateType: validated.templateType as any,
          notes: validated.notes,
          taxRate: validated.taxRate,
          taxAmount,
          totalAmount,
          clientId: validated.clientId,
          items: {
            create: validated.items.map((item, index) => ({
              ...item,
              order: index,
            })),
          },
        },
        include: { items: true },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError || (error as any).name === 'ZodError') {
      return NextResponse.json({ error: "入力内容に不備があります", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "更新に失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
