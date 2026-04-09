import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

export const dynamic = "force-dynamic";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string; backupId: string }> }
) {
    try {
        const { id: tenantId, backupId } = await params;
        const context = await getTenantContext();

        // 1. バックアップレコードの取得
        const backup = await (prisma as any).tenantBackup.findFirst({
            where: { id: backupId, tenantId },
        });

        if (!backup) {
            return NextResponse.json({ error: "バックアップが見つかりません" }, { status: 404 });
        }

        // 2. バックアップデータの取得
        let backupData: any = null;
        if (backup.fileUrl) {
            const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
            const { data, error } = await supabaseAdmin.storage
                .from("backups")
                .download(backup.fileUrl);

            if (error) {
                console.error("Storage download error:", error);
                throw new Error("ストレージからのデータ取得に失敗しました");
            }
            backupData = JSON.parse(await data.text());
        } else if (backup.data) {
            backupData = backup.data;
        }

        if (!backupData) {
            return NextResponse.json({ error: "バックアップデータが空です" }, { status: 400 });
        }

        // 3. リストア実行（トランザクション）
        await prisma.$transaction(async (tx) => {
            // 既存データの削除（従属関係に注意）
            // 順序: InvoiceItem -> Invoice -> Staff -> Client
            await (tx as any).invoiceItem.deleteMany({ where: { invoice: { tenantId } } });
            await (tx as any).invoice.deleteMany({ where: { tenantId } });
            await (tx as any).staff.deleteMany({ where: { tenantId } });
            await (tx as any).client.deleteMany({ where: { tenantId } });

            // データの再構築
            // Clients
            if (backupData.clients && Array.isArray(backupData.clients)) {
                for (const client of backupData.clients) {
                    const { id, tenantId: _, createdAt: __, updatedAt: ___, ...rest } = client;
                    await (tx as any).client.create({
                        data: { ...rest, id, tenantId }
                    });
                }
            }

            // Staffs
            if (backupData.staffs && Array.isArray(backupData.staffs)) {
                for (const staff of backupData.staffs) {
                    const { id, tenantId: _, createdAt: __, updatedAt: ___, ...rest } = staff;
                    await (tx as any).staff.create({
                        data: { ...rest, id, tenantId }
                    });
                }
            }

            // Invoices & InvoiceItems
            if (backupData.invoices && Array.isArray(backupData.invoices)) {
                for (const inv of backupData.invoices) {
                    const { id, tenantId: _, createdAt: __, updatedAt: ___, items, ...rest } = inv;
                    await (tx as any).invoice.create({
                        data: {
                            ...rest,
                            id,
                            tenantId,
                            items: {
                                create: items.map((item: any) => {
                                    const { id: itemId, invoiceId: ____, createdAt: _____, updatedAt: ______, ...itemRest } = item;
                                    return { ...itemRest, id: itemId };
                                })
                            }
                        }
                    });
                }
            }

            // 監査ログの記録
            await (tx as any).auditLog.create({
                data: {
                    tenantId,
                    action: "RESTORE_DATA",
                    resource: "BACKUP",
                    payload: `Restored from backup: ${backup.filename}`,
                    userId: (context as any).userId || "SYSTEM"
                }
            });
        });

        return NextResponse.json({ message: "リストアが正常に完了しました" });
    } catch (error) {
        console.error("POST /api/admin/tenants/[id]/backups/[backupId]/restore error:", error);
        return NextResponse.json({
            error: "リストアに失敗しました",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
