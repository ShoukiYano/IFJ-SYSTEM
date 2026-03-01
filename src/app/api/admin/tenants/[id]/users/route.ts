export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import bcrypt from "bcryptjs";

// テナント所属ユーザー管理API
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getTenantContext();
    if (!context || context.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const users = await (prisma as any).user.findMany({
      where: { tenantId: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/admin/tenants/[id]/users error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getTenantContext();
    if (!context || context.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, password, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "メールアドレスとパスワードは必須です" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await (prisma as any).user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || "TENANT_ADMIN",
        tenantId: params.id,
      },
    });

    return NextResponse.json({ message: "ユーザーを作成しました", userId: user.id });
  } catch (error) {
    console.error("POST /api/admin/tenants/[id]/users error:", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
