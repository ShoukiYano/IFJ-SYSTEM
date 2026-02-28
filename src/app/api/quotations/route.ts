import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getTenantContext } from "@/lib/tenantContext";
export const dynamic = "force-dynamic";

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
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const quotations = await prisma.quotation.findMany({
      where: {
        tenantId: context.tenantId,
        deletedAt: null
      },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotations);
  } catch (error) {
    console.error("GET /api/quotations error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    const validated = quotationSchema.parse(body);

    // 採番管理 (tenantId ごとに管理)
    let quotationNumber = validated.quotationNumber;
    if (!quotationNumber) {
      const sequence = await prisma.invoiceSequence.upsert({
        where: {
          tenantId_id: {
            tenantId: context.tenantId,
            id: "quotation"
          }
        },
        update: { current: { increment: 1 } },
        create: {
          id: "quotation",
          tenantId: context.tenantId,
          prefix: "EST-",
          current: 1
        },
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
        tenantId: context.tenantId,
        quotationNumber,
        clientId: validated.clientId,
        issueDate: new Date(validated.issueDate),
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        subject: validated.subject,
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
      include: { items: true, client: true }
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("POST /api/quotations error:", error);
    return NextResponse.json({ error: "作成に失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
