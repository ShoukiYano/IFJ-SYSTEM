import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
    companyName: z.string().min(1),
    subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { companyName, subdomain, email, password } = registerSchema.parse(body);

        // Check if subdomain exists (Double check)
        const existingTenant = await (prisma as any).tenant.findUnique({
            where: { subdomain },
        });
        if (existingTenant) {
            return NextResponse.json({ error: "サブドメインが既に使用されています" }, { status: 400 });
        }

        // Check if user email exists
        const existingUser = await (prisma as any).user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Create Tenant and User in transaction
        const result = await (prisma as any).$transaction(async (tx: any) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName,
                    subdomain,
                    isActive: true,
                },
            });

            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: "管理者",
                    role: "TENANT_ADMIN",
                    tenantId: tenant.id,
                },
            });

            return { tenant, user };
        });

        return NextResponse.json({
            success: true,
            tenantId: result.tenant.id,
            subdomain: result.tenant.subdomain
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "入力内容に不備があります", details: error.errors }, { status: 400 });
        }
        console.error("Registration error:", error);
        return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
    }
}
