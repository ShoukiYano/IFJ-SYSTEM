import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenantContext";
import { google } from "googleapis";
import { oauth2Client } from "@/lib/google-auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const context = await getTenantContext();
        if (!context) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const token = await prisma.googleOAuthToken.findUnique({
            where: { tenantId: context.tenantId }
        });

        if (!token) {
            return NextResponse.json({ 
                success: false, 
                error: "Googleアカウントが連携されていません。" 
            });
        }

        // Try to refresh and get user info to verify
        oauth2Client.setCredentials({ refresh_token: token.refreshToken });
        const { token: accessToken } = await oauth2Client.getAccessToken();
        
        if (!accessToken) {
            return NextResponse.json({ 
                success: false, 
                error: "トークンの更新に失敗しました。再連携をお試しください。" 
            });
        }

        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        return NextResponse.json({ 
            success: true, 
            email: userInfo.data.email 
        });
    } catch (error: any) {
        console.error("POST /api/auth/google/test error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "検証中にエラーが発生しました。" 
        });
    }
}
