export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== "SYSTEM_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { tenantId, userId, action } = await req.json();

        const cookieStore = await cookies();

        if (action === "STOP") {
            cookieStore.delete("x-impersonate-tenant-id");
            cookieStore.delete("x-impersonate-user-id");
            return NextResponse.json({ success: true });
        }

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
        }

        // Set impersonation cookies (HttpOnly for security)
        cookieStore.set("x-impersonate-tenant-id", tenantId, { httpOnly: true, secure: true, sameSite: "lax" });
        if (userId) {
            cookieStore.set("x-impersonate-user-id", userId, { httpOnly: true, secure: true, sameSite: "lax" });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Impersonation error:", error);
        return NextResponse.json({ error: "Failed to impersonate" }, { status: 500 });
    }
}
