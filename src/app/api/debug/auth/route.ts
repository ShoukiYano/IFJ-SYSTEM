import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userCount = await (prisma as any).user.count();

        return NextResponse.json({
            session,
            userCount,
            env: {
                DATABASE_URL: !!process.env.DATABASE_URL,
                NEXTAUTH_URL: process.env.NEXTAUTH_URL,
                NODE_ENV: process.env.NODE_ENV,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
