import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getTenantContext } from "@/lib/tenantContext";
import { createAuditLog } from "@/lib/audit";

const clientSchema = z.object({
  name: z.string().min(1, "会社名は必須です"),
  department: z.string().optional(),
  manager: z.string().optional(),
  honorific: z.string().default("御中"),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  tel: z.string().optional(),
  email: z.string().email("無効なメール形式です").optional().or(z.literal("")),
  ccEmail: z.string().email("無効なメール形式です").optional().or(z.literal("")),
  closingDay: z.number().min(1).max(31).default(31),
  paymentMonthOffset: z.number().min(0).max(2).default(1),
  paymentDay: z.number().min(1).max(31).default(31),
  isRecurring: z.boolean().default(false),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { 
        tenantId_id: {
          id: id,
          tenantId: context.tenantId 
        }
      },
    });

    if (!client || client.deletedAt) {
      return NextResponse.json({ error: "取引先が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("GET /api/clients/[id] error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    const validated = clientSchema.parse(body);

    const client = await prisma.client.update({
      where: { 
        tenantId_id: {
          id,
          tenantId: context.tenantId 
        }
      },
      data: validated as any,
    });

    // 監査ログ
    await createAuditLog({
        action: "CLIENT_UPDATE",
        resource: "client",
        payload: { id: client.id, name: client.name },
        tenantId: context.tenantId,
        userId: context.userId
    });

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof z.ZodError || (error as any).name === 'ZodError') {
      return NextResponse.json({ error: "入力内容に不備があります", details: (error as any).errors }, { status: 400 });
    }
    console.error("PATCH /api/clients/[id] error:", error);
    return NextResponse.json({ error: "更新に失敗しました", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    
    await prisma.client.update({
      where: { 
        tenantId_id: {
          id,
          tenantId: context.tenantId 
        }
      },
      data: { deletedAt: new Date() },
    });

    // 監査ログ
    await createAuditLog({
        action: "CLIENT_DELETE",
        resource: "client",
        payload: { id },
        tenantId: context.tenantId,
        userId: context.userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/clients/[id] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
