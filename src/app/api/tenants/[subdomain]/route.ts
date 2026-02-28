import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { subdomain: string } }
) {
    try {
        const { subdomain } = params;

        if (!subdomain) {
            return NextResponse.json({ error: "サブドメインが指定されていません" }, { status: 400 });
        }

        const tenant = await (prisma as any).tenant.findUnique({
            where: { subdomain },
            select: {
                id: true,
                name: true,
                subdomain: true,
                logoUrl: true,
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: "テナントが見つかりません" }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("GET /api/tenants/[subdomain] error:", error);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }
}
