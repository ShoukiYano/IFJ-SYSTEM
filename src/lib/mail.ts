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
    attachments?: {
        filename: string;
        content: Buffer | string;
    }[];
};

async function sendGmailOAuth2(options: SendMailOptions, tenantId: string) {
    const token = await prisma.googleOAuthToken.findUnique({
        where: { tenantId }
    });

    if (!token) {
        throw new Error("Google account not connected for this tenant");
    }

    oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        expiry_date: token.expiryDate.getTime(),
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (newTokens) => {
        if (newTokens.access_token) {
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
    } as any);

    return transporter.sendMail({
        from: `"${options.fromName || "請求書管理システム"}" <${token.email || process.env.SMTP_FROM}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.body,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(a => ({
            filename: a.filename,
            content: a.content,
        })),
    });
}

export async function sendMail(options: SendMailOptions) {
    // Determine tenant context if possible
    const { getTenantContext } = await import("./tenantContext");
    const context = await getTenantContext();

    if (context?.tenantId) {
        try {
            const result = await sendGmailOAuth2(options, context.tenantId);
            console.log("Email sent via Google OAuth2");
            return { success: true, data: result };
        } catch (error) {
            console.warn("Gmail OAuth2 failed, falling back to other methods:", error);
        }
    }

    // SMTP Fallback (Legacy / App Password)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
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
                })),
            });
            console.log("Email sent via SMTP:", info.messageId);
            return { success: true, data: info };
        } catch (error) {
            console.error("SMTP send error:", error);
        }
    }

    // Resend Fallback
    if (resend) {
        try {
            const from = options.fromName
                ? `${options.fromName} <onboarding@resend.dev>`
                : "Invoice System <onboarding@resend.dev>";

            const result = await resend.emails.send({
                from,
                to: options.to,
                subject: options.subject,
                text: options.body,
                replyTo: options.replyTo,
                attachments: options.attachments?.map(a => ({
                    filename: a.filename,
                    content: a.content,
                })),
            });

            if (result.error) {
                console.error("Resend error:", result.error);
                return { success: false, error: result.error.message };
            }

            return { success: true, data: result.data };
        } catch (error) {
            console.error("Resend send error:", error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    console.warn("No email service (SMTP or Resend) configured.");
    return { success: false, error: "Email configuration missing" };
}

export { renderTemplate };
