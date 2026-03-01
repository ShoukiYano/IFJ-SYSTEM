import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await (prisma as any).user.update({
            where: { id: (session.user as any).id },
            data: { tosAcceptedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API-TOS] Failed to update ToS status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
