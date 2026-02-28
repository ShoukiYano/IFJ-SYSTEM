import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import * as xlsx from "xlsx";

export async function POST(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(new Uint8Array(buffer), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length < 2) {
      return NextResponse.json({ error: "データが含まれていません" }, { status: 400 });
    }

    const headers = data[0];
    const rows = data.slice(1);

    const results = [];
    const errors = [];

    // クライアント名のキャッシュ
    const clientCache: Record<string, string> = {};

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row[1]) continue; // 名前がない行はスキップ

        const name = row[1];
        const clientName = row[2];
        const manager = row[3];
        const paymentTerms = row[4];
        const unitPrice = parseFloat(row[5]);
        const settlementUnit = parseInt(row[7]);
        const minHours = parseFloat(row[8]);
        const maxHours = parseFloat(row[9]);
        const deductionAmount = parseFloat(row[10]);
        const excessAmount = parseFloat(row[11]);
        const roundingUnit = parseInt(row[12]);

        try {
            // クライアントの取得または作成
            let clientId = clientCache[clientName];
            if (!clientId) {
                let client = await (prisma as any).client.findFirst({
                    where: { name: clientName, tenantId: context.tenantId, deletedAt: null }
                });

                if (!client) {
                    client = await (prisma as any).client.create({
                        data: {
                            name: clientName,
                            tenantId: context.tenantId,
                        }
                    });
                }
                clientId = client.id;
                clientCache[clientName] = clientId;
            }

            // 要員の作成
            const staff = await (prisma as any).staff.create({
                data: {
                    tenantId: context.tenantId,
                    name,
                    clientId,
                    manager: manager ? String(manager) : null,
                    unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                    paymentTerms: paymentTerms ? String(paymentTerms) : null,
                    settlementUnit: isNaN(settlementUnit) ? null : settlementUnit,
                    minHours: isNaN(minHours) ? null : minHours,
                    maxHours: isNaN(maxHours) ? null : maxHours,
                    deductionAmount: isNaN(deductionAmount) ? null : deductionAmount,
                    excessAmount: isNaN(excessAmount) ? null : excessAmount,
                    roundingUnit: isNaN(roundingUnit) ? null : roundingUnit,
                }
            });
            results.push(staff);
        } catch (err) {
            console.error(`Error importing row ${i + 2}:`, err);
            errors.push({ row: i + 2, name, error: err instanceof Error ? err.message : String(err) });
        }
    }

    return NextResponse.json({ 
        message: `${results.length}件のインポートが完了しました`,
        count: results.length,
        errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("POST /api/staff/import error:", error);
    return NextResponse.json({ error: "インポートに失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
