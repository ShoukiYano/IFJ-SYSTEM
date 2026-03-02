import { NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google-auth";
import prisma from "@/lib/prisma";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const tenantId = searchParams.get("state"); // We passed tenantId as state

    if (!code || !tenantId) {
        return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
    }

    try {
        // Exchange for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get the user's email address
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
            throw new Error("必要なトークンが取得できませんでした");
        }

        // Save tokens to database
        await prisma.googleOAuthToken.upsert({
            where: { tenantId },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: new Date(tokens.expiry_date),
                email: email || null,
            },
            create: {
                tenantId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: new Date(tokens.expiry_date),
                email: email || null,
            },
        });

        // Redirect back to settings page
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?google_connected=success`);
    } catch (error) {
        console.error("GET /api/auth/google/callback error:", error);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?google_connected=error`);
    }
}
