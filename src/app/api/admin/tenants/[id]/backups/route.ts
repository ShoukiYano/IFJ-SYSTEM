import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getTenantContext();
    if (!context || context.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const backups = await (prisma as any).tenantBackup.findMany({
      where: { tenantId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(backups);
  } catch (error) {
    console.error("GET /api/admin/tenants/[id]/backups error:", error);
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

    // 実際のバックアップ処理（スナップショットを作成）
    const tenant = await (prisma as any).tenant.findUnique({
      where: { id: params.id },
      include: {
        users: { select: { email: true, role: true } },
        clients: true,
        staffs: true,
        invoices: { include: { items: true } },
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: "テナントが見つかりません" }, { status: 404 });
    }

    const timestamp = new Date().toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).replace(/\//g, "").replace(/ /g, "_").replace(/:/g, "");
    
    const filename = `backup_${tenant.name}_${timestamp}.json`;

    const backup = await (prisma as any).tenantBackup.create({
      data: {
        tenantId: params.id,
        filename,
        backupType: "MANUAL",
        data: tenant, // スナップショットをJSONとして保存
        size: JSON.stringify(tenant).length,
      }
    });

    return NextResponse.json(backup);
  } catch (error) {
    console.error("POST /api/admin/tenants/[id]/backups error:", error);
    return NextResponse.json({ error: "バックアップに失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
