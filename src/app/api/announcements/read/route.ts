export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export async function POST(req: Request) {
    try {
        const context = await getTenantContext();
        if (!context || !context.tenantId) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const { tenantId } = context;
        const body = await req.json();
        const { announcementIds } = body;

        if (!announcementIds || !Array.isArray(announcementIds)) {
            return NextResponse.json({ error: "announcementIdsは必須です" }, { status: 400 });
        }

        // 既読レコードをバッチ作成（既に存在する場合は無視）
        // Prismaでupsertをバッチで行うのは難しいので個別に行うか、
        // createManyを使う（PostgreSQL限定かつ重複エラーに注意が必要な場合もある）
        // ここでは安全に個別またはtransactionで対応

        const operations = announcementIds.map((id) =>
            (prisma as any).announcementRead.upsert({
                where: {
                    announcementId_tenantId: {
                        announcementId: id,
                        tenantId,
                    },
                },
                update: {},
                create: {
                    announcementId: id,
                    tenantId,
                },
            })
        );

        await (prisma as any).$transaction(operations);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/announcements/read error:", error);
        return NextResponse.json({ error: "既読処理に失敗しました" }, { status: 500 });
    }
}
