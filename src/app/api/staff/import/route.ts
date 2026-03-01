import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import * as xlsx from "xlsx";

function parseExcelDate(val: any) {
    if (!val) return null;
    // Excelの日付数値形式
    if (typeof val === 'number') {
        const date = xlsx.SSF.parse_date_code(val);
        return new Date(date.y, date.m - 1, date.d);
    }
    const dateStr = String(val).trim();
    // YYYY/MM, YYYY-MM, YYYY年MM月 をパース
    const match = dateStr.match(/(\d{4})[/\-年](\d{1,2})/);
    if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

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
        let duplicates = 0;

        // クライアント名のキャッシュ
        const clientCache: Record<string, string> = {};

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || !row[1]) continue; // 名前がない行はスキップ

            const name = String(row[1]).trim();
            const typeStr = String(row[2]).trim();
            const areaStr = String(row[3]).trim();
            const clientName = String(row[4]).trim();
            const manager = row[5];
            const paymentTerms = row[6];
            const unitPrice = parseFloat(row[7]);
            const settlementUnit = parseInt(row[8]);
            const minHours = parseFloat(row[9]);
            const maxHours = parseFloat(row[10]);
            const deductionAmount = parseFloat(row[11]);
            const excessAmount = parseFloat(row[12]);
            const roundingUnit = parseInt(row[13]);

            // 区分とエリアのマッピング
            const type = typeStr.includes("BP") ? "BP" : "PROPER";
            let area = "KANTO";
            if (areaStr.includes("関西")) area = "KANSAI";
            else if (areaStr.includes("名古屋")) area = "NAGOYA";

            try {
                // 重複チェック（同じ名前の要員が既に存在するか）
                const existingStaff = await (prisma as any).staff.findFirst({
                    where: {
                        name,
                        tenantId: context.tenantId,
                        deletedAt: null,
                    }
                });

                if (existingStaff) {
                    duplicates++;
                    continue;
                }

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
                        type,
                        area,
                        clientId,
                        manager: manager ? String(manager) : null,
                        unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                        paymentTerms: paymentTerms ? String(paymentTerms) : null,
                        // contractStartDate はExcelに列がないため、一旦 null または 45日のような文字列から推測するのは難しいため null
                        contractStartDate: null,
                        settlementUnit: (isNaN(settlementUnit) || !row[8]) ? 15 : settlementUnit,
                        minHours: isNaN(minHours) ? null : minHours,
                        maxHours: isNaN(maxHours) ? null : maxHours,
                        deductionAmount: isNaN(deductionAmount) ? null : deductionAmount,
                        excessAmount: isNaN(excessAmount) ? null : excessAmount,
                        roundingUnit: isNaN(roundingUnit) ? null : roundingUnit,
                        renewalInterval: null, // Excelに列がないため null
                    }
                });
                results.push(staff);
            } catch (err) {
                console.error(`Error importing row ${i + 2}:`, err);
                errors.push({ row: i + 2, name, error: err instanceof Error ? err.message : String(err) });
            }
        }

        return NextResponse.json({
            message: `${results.length}件のインポートが完了しました${duplicates > 0 ? `（${duplicates}件は既に存在するためスキップしました）` : ''}`,
            count: results.length,
            duplicates: duplicates,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("POST /api/staff/import error:", error);
        return NextResponse.json({ error: "インポートに失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
