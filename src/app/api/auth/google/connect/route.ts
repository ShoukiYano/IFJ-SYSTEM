import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenantContext";
import { getAuthUrl } from "@/lib/google-auth";

export async function GET() {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        // Pass the tenant ID as the 'state' to ensure we can identify the tenant in the callback
        const authUrl = getAuthUrl(context.tenantId);

        return NextResponse.json({ url: authUrl });
    } catch (error) {
        console.error("GET /api/auth/google/connect error:", error);
        return NextResponse.json({ error: "認可URLの生成に失敗しました" }, { status: 500 });
    }
}
