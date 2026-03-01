import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subdomain = searchParams.get("subdomain");

    if (!subdomain) {
        return NextResponse.json({ available: false });
    }

    // Reserved keywords
    const reserved = ["admin", "api", "www", "portal", "support", "help", "login", "register", "t"];
    if (reserved.includes(subdomain.toLowerCase())) {
        return NextResponse.json({ available: false });
    }

    try {
        const existing = await (prisma as any).tenant.findUnique({
            where: { subdomain: subdomain.toLowerCase() },
        });

        return NextResponse.json({ available: !existing });
    } catch (error) {
        console.error("Check subdomain error:", error);
        return NextResponse.json({ available: false }, { status: 500 });
    }
}
