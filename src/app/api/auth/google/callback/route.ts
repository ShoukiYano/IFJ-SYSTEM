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
        console.log(`[google-auth-callback] Received code for tenantId: ${tenantId}`);
        // Exchange for tokens
        const { tokens } = await oauth2Client.getToken(code);
        console.log(`[google-auth-callback] Successfully exchanged code for tokens. Refresh token present: ${!!tokens.refresh_token}`);

        oauth2Client.setCredentials(tokens);

        // Get the user's email address
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;
        console.log(`[google-auth-callback] User email: ${email}`);

        if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
            console.error(`[google-auth-callback] Missing required tokens: access=${!!tokens.access_token}, refresh=${!!tokens.refresh_token}, expiry=${!!tokens.expiry_date}`);
            throw new Error("必要なトークンが取得できませんでした");
        }

        // Save tokens to database
        const savedToken = await prisma.googleOAuthToken.upsert({
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
        console.log(`[google-auth-callback] Successfully saved/updated token for tenantId: ${tenantId}. DB ID: ${savedToken.id}`);

        // Redirect back to settings page
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?google_connected=success`);
    } catch (error) {
        console.error("[google-auth-callback] Error in callback:", error);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?google_connected=error`);
    }
}
