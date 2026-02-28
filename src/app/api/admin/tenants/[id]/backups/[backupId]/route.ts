import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export const dynamic = "force-dynamic";

export async function GET(
    req: Request,
    { params }: { params: { id: string; backupId: string } }
) {
    try {
        const context = await getTenantContext();
        if (!context || context.role !== "SYSTEM_ADMIN") {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }

        const backup = await (prisma as any).tenantBackup.findUnique({
            where: {
                id: params.backupId,
                tenantId: params.id
            },
        });

        if (!backup) {
            return NextResponse.json({ error: "バックアップが見つかりません" }, { status: 404 });
        }

        let dataToReturn: any = null;

        // 1. 新しいストレージ方式の場合
        if (backup.fileUrl) {
            const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
            const { data, error } = await supabaseAdmin.storage
                .from("backups")
                .download(backup.fileUrl);

            if (error) {
                console.error("Storage download error:", error);
                return NextResponse.json({ error: "ストレージからの取得に失敗しました" }, { status: 500 });
            }

            dataToReturn = await data.text();
        }
        // 2. レガシーなDB保存方式の場合
        else if (backup.data) {
            dataToReturn = JSON.stringify(backup.data, null, 2);
        }
        else {
            return NextResponse.json({ error: "バックアップデータが空です" }, { status: 404 });
        }

        // JSONデータを返却
        return new NextResponse(dataToReturn, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${backup.filename}"`,
            },
        });
    } catch (error) {
        console.error("GET /api/admin/tenants/[id]/backups/[backupId] error:", error);
        return NextResponse.json({ error: "ダウンロードに失敗しました" }, { status: 500 });
    }
}
