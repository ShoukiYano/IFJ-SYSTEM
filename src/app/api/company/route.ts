import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const companySchema = z.object({
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
    const company = await prisma.company.findFirst();
    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const validated = companySchema.parse(body);
    
    // 最初の1件を更新、なければ作成
    const firstCompany = await prisma.company.findFirst();
    
    const company = await prisma.company.upsert({
      where: { id: firstCompany?.id || "default-company" },
      update: validated,
      create: {
        id: "default-company",
        ...validated,
      },
    });
    
    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
