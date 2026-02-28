import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getTenantContext } from "@/lib/tenantContext";

const tenantSchema = z.object({
  name: z.string().min(1, "会社名は必須です"),
  zipCode: z.string().min(1, "郵便番号は必須です"),
  address: z.string().min(1, "住所は必須です"),
  tel: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  registrationNumber: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankBranch: z.string().nullable().optional(),
  bankAccountType: z.string().nullable().optional(),
  bankAccountNumber: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  stampUrl: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
    });
    return NextResponse.json(tenant);
  } catch (error) {
    console.error("GET /api/company error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    const validated = tenantSchema.parse(body);
    
    const tenant = await prisma.tenant.update({
      where: { id: context.tenantId },
      data: validated,
    });
    
    return NextResponse.json(tenant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("PUT /api/company error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
