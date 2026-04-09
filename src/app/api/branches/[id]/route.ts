import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

// PUT: 支社情報を更新
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const context = await getTenantContext();
    if (!context) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

    const { name, zipCode, address, order } = await req.json();

    const branch = await (prisma as any).branchOffice.updateMany({
        where: { id: id, tenantId: context.tenantId },
        data: { name, zipCode, address, order },
    });
    return NextResponse.json(branch);
}

// DELETE: 支社を削除
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const context = await getTenantContext();
    if (!context) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

    await (prisma as any).branchOffice.deleteMany({
        where: { id: id, tenantId: context.tenantId },
    });
    return NextResponse.json({ success: true });
}
