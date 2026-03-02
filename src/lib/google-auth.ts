import { google } from "googleapis";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;

export const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
);

export const GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Get the authorization URL for a tenant
 */
export function getAuthUrl(state: string) {
    return oauth2Client.generateAuthUrl({
        access_type: "offline", // Essential to get refresh token
        prompt: "consent",      // Ensure refresh token is provided
        scope: GMAIL_SCOPES,
        state,
    });
}
