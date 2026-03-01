export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import bcrypt from "bcryptjs";
import { z } from "zod";

const userSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8).optional(),
    role: z.enum(["TENANT_ADMIN", "TENANT_USER"]),
});

export async function GET() {
    try {
        const context = await getTenantContext();
        if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const users = await (prisma as any).user.findMany({
            where: { tenantId: context.tenantId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context || context.role !== "TENANT_ADMIN") {
            return NextResponse.json({ error: "Only admins can invite users" }, { status: 403 });
        }

        const body = await req.json();
        const validated = userSchema.parse(body);

        const existing = await (prisma as any).user.findUnique({ where: { email: validated.email } });
        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(validated.password || "temp123456", 12);

        const user = await (prisma as any).user.create({
            data: {
                ...validated,
                password: hashedPassword,
                tenantId: context.tenantId,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context || context.role !== "TENANT_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id, ...data } = await req.json();
        const validated = userSchema.partial().parse(data);

        const user = await (prisma as any).user.update({
            where: { id, tenantId: context.tenantId },
            data: validated,
        });

        return NextResponse.json(user);
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context || context.role !== "TENANT_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await req.json();

        // Prevent self-deletion if they are the only admin
        if (id === context.userId) {
            return NextResponse.json({ error: "自分自身を削除することはできません" }, { status: 400 });
        }

        await (prisma as any).user.delete({
            where: { id, tenantId: context.tenantId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
