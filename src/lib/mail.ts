import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

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

export async function sendMail(options: SendMailOptions) {
    if (!resend) {
        console.warn("RESEND_API_KEY is not set. Email will not be sent.");
        return { success: false, error: "Email configuration missing" };
    }

    try {
        const { to, subject, body, fromName, replyTo, attachments } = options;

        // Default system email if not configured
        const from = fromName
            ? `${fromName} <onboarding@resend.dev>`
            : "Invoice System <onboarding@resend.dev>";

        const result = await resend.emails.send({
            from,
            to,
            subject,
            text: body,
            replyTo,
            attachments: attachments?.map(a => ({
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
        console.error("sendMail error:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Replace placeholders in template content
 */
export function renderTemplate(content: string, variables: Record<string, string>) {
    let rendered = content;
    Object.entries(variables).forEach(([key, value]) => {
        rendered = rendered.replaceAll(`{{${key}}}`, value || "");
    });
    return rendered;
}
