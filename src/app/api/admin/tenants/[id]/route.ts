export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { createAuditLog } from "@/lib/audit";

// 通用テナント詳細API
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getTenantContext();
    if (!context || context.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const tenant = await (prisma as any).tenant.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            users: true,
            clients: { where: { deletedAt: null } },
            invoices: { where: { deletedAt: null } }
          }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: "テナントが見つかりません" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("GET /api/admin/tenants/[id] error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getTenantContext();
    if (!context || context.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await req.json();
    const { name, subdomain, registrationNumber, address, tel, email, isActive, hasInvoiceFeature, hasAttendanceFeature } = body;

    const tenant = await (prisma as any).tenant.update({
      where: { id: id },
      data: {
        name,
        subdomain,
        registrationNumber,
        address,
        tel,
        email,
        isActive,
        hasInvoiceFeature,
        hasAttendanceFeature,
      },
    });

    // 監査ログ
    await createAuditLog({
        action: "TENANT_UPDATE",
        resource: "tenant",
        payload: { id: tenant.id, name: tenant.name },
        userId: context.userId
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("PATCH /api/admin/tenants/[id] error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getTenantContext();
    if (!context || context.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // カスケード削除されることに注意（schemaでCascade設定済み）
    await (prisma as any).tenant.delete({
      where: { id: id },
    });

    // 監査ログ
    await createAuditLog({
        action: "TENANT_DELETE",
        resource: "tenant",
        payload: { id: id },
        userId: context.userId
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("DELETE /api/admin/tenants/[id] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
