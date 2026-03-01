import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    console.log("[DEBUG-DB] Direct DB check started");
    try {
        const start = Date.now();
        const userCount = await (prisma as any).user.count();
        const end = Date.now();

        return NextResponse.json({
            success: true,
            userCount,
            duration: `${end - start}ms`,
            env: process.env.NODE_ENV,
        });
    } catch (error: any) {
        console.error("[DEBUG-DB] Direct DB check failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
