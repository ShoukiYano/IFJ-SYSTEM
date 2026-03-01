import { tenantStorage } from "./tenantStore";
import { getTenantContext } from "./tenantContext";
import { NextResponse } from "next/server";

export function withTenant(handler: Function) {
    return async (...args: any[]) => {
        const context = await getTenantContext();

        if (!context || !context.tenantId) {
            if (args[0] instanceof Request) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return handler(...args); // Fallback for cases without request context if needed
        }

        return tenantStorage.run({ tenantId: context.tenantId, userId: context.userId }, () => {
            return handler(...args);
        });
    };
}

/**
 * For Server Components, we can use this in the layout or page
 */
export async function provideTenantContext(children: () => Promise<React.ReactNode>) {
    const context = await getTenantContext();
    if (!context || !context.tenantId) return children();

    return tenantStorage.run({ tenantId: context.tenantId, userId: context.userId }, () => {
        return children();
    });
}
