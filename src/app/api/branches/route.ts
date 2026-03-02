import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

// GET: 支社一覧を取得
export async function GET() {
    const context = await getTenantContext();
    if (!context) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

    const branches = await (prisma as any).branchOffice.findMany({
        where: { tenantId: context.tenantId },
        orderBy: { order: "asc" },
    });
    return NextResponse.json(branches);
}

// POST: 支社を追加
export async function POST(req: Request) {
    const context = await getTenantContext();
    if (!context) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

    const { name, zipCode, address, order } = await req.json();
    if (!name) return NextResponse.json({ error: "支社名は必須です" }, { status: 400 });

    const branch = await (prisma as any).branchOffice.create({
        data: { tenantId: context.tenantId, name, zipCode, address, order: order ?? 0 },
    });
    return NextResponse.json(branch);
}
