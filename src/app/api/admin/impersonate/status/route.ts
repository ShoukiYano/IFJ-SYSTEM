import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenantContext";

export const dynamic = "force-dynamic";

export async function GET() {
    const context = await getTenantContext();
    return NextResponse.json({
        isImpersonating: !!context?.isImpersonating,
        tenantId: context?.tenantId,
    });
}
