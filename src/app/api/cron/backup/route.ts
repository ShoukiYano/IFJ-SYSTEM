import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

// Vercel Cron Jobs はGETリクエストで呼び出す
export async function GET(req: Request) {
  // CRON_SECRET による認証（不正呼び出し防止）
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
  const results: { tenantId: string; status: string; error?: string }[] = [];
  let deletedCount = 0;

  try {
    // ① 全テナントを取得（削除済み除く）
    const tenants = await (prisma as any).tenant.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    // ② 各テナントのバックアップを作成
    for (const tenant of tenants) {
      try {
        const data = await (prisma as any).tenant.findUnique({
          where: { id: tenant.id },
          include: {
            users: { select: { email: true, role: true } },
            clients: true,
            staffs: true,
            invoices: { include: { items: true } },
          },
        });

        if (!data) {
          results.push({ tenantId: tenant.id, status: "skipped", error: "not found" });
          continue;
        }

        // ASCIIのみのタイムスタンプ生成
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
        const filename = `backup_${tenant.id}_${timestamp}.json`;
        const storagePath = `${tenant.id}/${filename}`;
        const jsonContent = JSON.stringify(data, null, 2);

        // Supabase Storage へアップロード
        const { error: uploadError } = await supabaseAdmin.storage
          .from("backups")
          .upload(storagePath, jsonContent, {
            contentType: "application/json",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // DBにバックアップレコードを作成
        await (prisma as any).tenantBackup.create({
          data: {
            tenantId: tenant.id,
            filename,
            backupType: "AUTO",
            data: null,
            fileUrl: storagePath,
            size: jsonContent.length,
          },
        });

        results.push({ tenantId: tenant.id, status: "success" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Backup failed for tenant ${tenant.id}:`, message);
        results.push({ tenantId: tenant.id, status: "error", error: message });
      }
    }

    // ③ 30日超の古いバックアップを削除
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldBackups = await (prisma as any).tenantBackup.findMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
      select: { id: true, fileUrl: true },
    });

    for (const backup of oldBackups) {
      try {
        // Supabase Storage から削除
        if (backup.fileUrl) {
          await supabaseAdmin.storage
            .from("backups")
            .remove([backup.fileUrl]);
        }
        // DBレコードを削除
        await (prisma as any).tenantBackup.delete({
          where: { id: backup.id },
        });
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete old backup ${backup.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      deleted: deletedCount,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron backup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
