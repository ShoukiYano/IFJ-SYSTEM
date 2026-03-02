import { Resend } from "resend";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { oauth2Client } from "./google-auth";
import prisma from "./prisma";
import { renderTemplate } from "./template";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type SendMailOptions = {
    to: string | string[];
    subject: string;
    body: string;
    fromName?: string;
    replyTo?: string;
    tenantId?: string; // Explicitly pass tenantId if known
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }[];
};

async function sendGmailOAuth2(options: SendMailOptions, tenantId: string) {
    console.log(`[mail] Attempting Gmail OAuth2 for tenant: ${tenantId}`);
    const token = await prisma.googleOAuthToken.findUnique({
        where: { tenantId }
    });

    if (!token) {
        throw new Error(`Google account not connected for tenant ${tenantId}`);
    }

    console.log(`[mail] Found token for ${token.email}. Refresh token present: ${!!token.refreshToken}`);
    oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        expiry_date: token.expiryDate.getTime(),
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (newTokens) => {
        if (newTokens.access_token) {
            console.log(`[mail] Token refreshed for tenant: ${tenantId}`);
            await prisma.googleOAuthToken.update({
                where: { tenantId },
                data: {
                    accessToken: newTokens.access_token,
                    expiryDate: newTokens.expiry_date ? new Date(newTokens.expiry_date) : undefined,
                    refreshToken: newTokens.refresh_token || undefined,
                }
            });
        }
    });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: token.email || process.env.SMTP_USER,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: token.refreshToken,
            accessToken: token.accessToken,
        },
    });

    console.log(`[mail] Sending via Nodemailer/Gmail...`);
    return transporter.sendMail({
        from: `"${options.fromName || "請求書管理システム"}" <${token.email || process.env.SMTP_FROM}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.body,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType || 'application/pdf',
        })),
    });
}

export async function sendMail(options: SendMailOptions) {
    console.log(`[mail] Starting sendMail process to: ${options.to}`);

    // Determine tenant context
    let tenantId = options.tenantId;
    if (!tenantId) {
        try {
            const { getTenantContext } = await import("./tenantContext");
            const context = await getTenantContext();
            tenantId = context?.tenantId;
        } catch (ctxError) {
            console.warn("[mail] Could not determine tenant context:", ctxError);
        }
    }

    if (tenantId) {
        try {
            const result = await sendGmailOAuth2(options, tenantId);
            console.log("[mail] Email sent successfully via Google OAuth2");
            return { success: true, data: result };
        } catch (error) {
            console.warn(`[mail] Gmail OAuth2 failed for tenant ${tenantId}. Falling back:`, error);
        }
    } else {
        console.log("[mail] No tenantId found, skipping Gmail OAuth2");
    }

    // SMTP Fallback (Legacy / App Password)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            console.log("[mail] Attempting SMTP fallback...");
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const info = await transporter.sendMail({
                from: options.fromName ? `"${options.fromName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>` : process.env.SMTP_FROM || process.env.SMTP_USER,
                to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
                subject: options.subject,
                text: options.body,
                replyTo: options.replyTo,
                attachments: options.attachments?.map(a => ({
                    filename: a.filename,
                    content: a.content,
                    contentType: a.contentType || 'application/pdf',
                })),
            });
            console.log("[mail] Email sent successfully via SMTP:", info.messageId);
            return { success: true, data: info };
        } catch (error) {
            console.error("[mail] SMTP fallback failed:", error);
        }
    }

    // Resend Fallback
    if (resend) {
        try {
            console.log("[mail] Attempting Resend fallback...");
            const from = options.fromName
                ? `${options.fromName} <onboarding@resend.dev>`
                : "Invoice System <onboarding@resend.dev>";

            // Resend attachments format
            const resendAttachments = options.attachments?.map(a => ({
                filename: a.filename,
                content: a.content, // Resend accepts Buffer, string, etc.
            }));

            console.log(`[mail] Sending via Resend with ${resendAttachments?.length || 0} attachments...`);
            const result = await resend.emails.send({
                from,
                to: options.to,
                subject: options.subject,
                text: options.body,
                replyTo: options.replyTo,
                attachments: resendAttachments,
            });

            if (result.error) {
                console.error("[mail] Resend API error:", result.error);
                return { success: false, error: result.error.message };
            }

            console.log("[mail] Email sent successfully via Resend");
            return { success: true, data: result.data };
        } catch (error) {
            console.error("[mail] Resend fallback failed:", error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    console.warn("[mail] No email service (Gmail, SMTP or Resend) available/configured.");
    return { success: false, error: "Email configuration missing or all methods failed" };
}

export { renderTemplate };
