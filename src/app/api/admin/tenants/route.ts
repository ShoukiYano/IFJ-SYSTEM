export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function GET() {
  try {
    const context = await getTenantContext();
    if (!context || context.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const tenants = await (prisma as any).tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { users: true, clients: true }
        }
      }
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error("GET /api/admin/tenants error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context || context.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await req.json();
    const { name, subdomain, registrationNumber, address, tel, email } = body;

    if (!name) {
      return NextResponse.json({ error: "テナント名は必須です" }, { status: 400 });
    }

    const tenant = await (prisma as any).tenant.create({
      data: {
        name,
        subdomain,
        registrationNumber,
        address,
        tel,
        email,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("POST /api/admin/tenants error:", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
