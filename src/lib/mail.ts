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
    cc?: string | string[];
    tenantId?: string; // Explicitly pass tenantId if known
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }[];
};

async function sendGmailOAuth2(options: SendMailOptions, tenantId: string) {
    // console.log(`[mail] Attempting Gmail OAuth2 for tenant: ${tenantId}`);
    const token = await prisma.googleOAuthToken.findUnique({
        where: { tenantId }
    });

    if (!token) {
        throw new Error(`Google account not connected for tenant ${tenantId}`);
    }

    // console.log(`[mail] Found token for ${token.email}. Refresh token present: ${!!token.refreshToken}`);
    oauth2Client.setCredentials({
        refresh_token: token.refreshToken,
    });

    // Manually refresh to be 100% sure
    // console.log("[mail] Manually refreshing access token via Google API...");
    const { token: accessToken } = await oauth2Client.getAccessToken();

    if (!accessToken) {
        throw new Error("Failed to refresh access token");
    }
    oauth2Client.setCredentials({ access_token: accessToken });
    // console.log("[mail] Access token refreshed successfully.");

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // console.log(`[mail] Sending via direct Gmail API (User: ${token.email})...`);

    // Construct MIME message
    const boundary = "foo_bar_baz";
    const subject = options.subject;
    const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    const fromName = options.fromName || "請求書管理システム";

    let messageParts = [
        `From: "${fromName}" <${token.email}>`,
        `To: ${to}`,
        ...(options.cc ? [`Cc: ${Array.isArray(options.cc) ? options.cc.join(", ") : options.cc}`] : []),
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        options.body,
        '',
    ];

    // Add attachments if any (though we are moving to links, keep logic for flexibility)
    if (options.attachments && options.attachments.length > 0) {
        for (const attachment of options.attachments) {
            const content = typeof attachment.content === 'string'
                ? Buffer.from(attachment.content).toString('base64')
                : attachment.content.toString('base64');

            messageParts.push(`--${boundary}`);
            messageParts.push(`Content-Type: ${attachment.contentType || 'application/octet-stream'}`);
            messageParts.push('Content-Transfer-Encoding: base64');
            messageParts.push(`Content-Disposition: attachment; filename="=?utf-8?B?${Buffer.from(attachment.filename).toString('base64')}?="`);
            messageParts.push('');
            messageParts.push(content);
            messageParts.push('');
        }
    }

    messageParts.push(`--${boundary}--`);

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: encodedMessage,
            },
        });
        // console.log("[mail] Email sent successfully via Gmail API");
        return { success: true };
    } catch (apiError: any) {
        console.error("[mail] Gmail API Send Error details:", {
            message: apiError.message,
            code: apiError.code,
            errors: apiError.errors
        });
        throw apiError;
    }
}

export async function sendMail(options: SendMailOptions) {
    // console.log(`[mail] Starting sendMail process to: ${options.to}`);

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
            // console.log("[mail] Email sent successfully via Google OAuth2");
            return { success: true, data: result };
        } catch (error) {
            console.warn(`[mail] Gmail OAuth2 failed for tenant ${tenantId}. Falling back:`, error);
        }
    } else {
        // console.log("[mail] No tenantId found, skipping Gmail OAuth2");
    }

    // SMTP Fallback (Legacy / App Password)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            // console.log("[mail] Attempting SMTP fallback...");
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
                cc: options.cc,
                attachments: options.attachments?.map(a => ({
                    filename: a.filename,
                    content: a.content,
                    contentType: a.contentType || 'application/pdf',
                })),
            });
            // console.log("[mail] Email sent successfully via SMTP:", info.messageId);
            return { success: true, data: info };
        } catch (error) {
            console.error("[mail] SMTP fallback failed:", error);
        }
    }

    // Resend Fallback
    if (resend) {
        try {
            // console.log("[mail] Attempting Resend fallback...");
            const from = options.fromName
                ? `${options.fromName} <onboarding@resend.dev>`
                : "Invoice System <onboarding@resend.dev>";

            // Resend attachments format
            const resendAttachments = options.attachments?.map(a => ({
                filename: a.filename,
                content: a.content, // Resend accepts Buffer, string, etc.
            }));

            // console.log(`[mail] Sending via Resend with ${resendAttachments?.length || 0} attachments...`);
            const result = await resend.emails.send({
                from,
                to: options.to,
                subject: options.subject,
                text: options.body,
                replyTo: options.replyTo,
                cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(", ") : options.cc) : undefined,
                attachments: resendAttachments,
            });

            if (result.error) {
                console.error("[mail] Resend API error:", result.error);
                return { success: false, error: result.error.message };
            }

            // console.log("[mail] Email sent successfully via Resend");
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
