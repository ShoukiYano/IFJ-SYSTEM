export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const user = await (prisma as any).user.findUnique({
      where: { email: session.user.email!.toLowerCase() },
      select: { email: true, name: true, role: true }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/admin/profile error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, currentPassword, newPassword } = body;

    const user = await (prisma as any).user.findUnique({
      where: { email: session.user.email!.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const data: any = {};
    if (email) data.email = email;
    if (name) data.name = name;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "現在のパスワードを入力してください" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password!);
      if (!isValid) {
        return NextResponse.json({ error: "現在のパスワードが正しくありません" }, { status: 400 });
      }

      data.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await (prisma as any).user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({ message: "更新しました" });
  } catch (error) {
    console.error("PATCH /api/admin/profile error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
