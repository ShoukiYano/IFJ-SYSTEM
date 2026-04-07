import prisma from "./prisma";
import { getTenantContext } from "./tenantContext";

export async function createAuditLog(params: {
    action: string;
    resource: string;
    payload?: any;
    tenantId?: string;
    userId?: string;
}) {
    try {
        let { action, resource, payload, tenantId, userId } = params;

        // If tenantId or userId are missing, try to get them from context
        if (!tenantId || !userId) {
            try {
                const context = await getTenantContext();
                if (context) {
                    if (!tenantId) tenantId = context.tenantId;
                    if (!userId) userId = context.userId;
                }
            } catch (e) {
                // Ignore errors if context is not available (e.g., outside of request)
            }
        }

        return await (prisma as any).auditLog.create({
            data: {
                action,
                resource,
                payload: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : null,
                tenantId: tenantId || null,
                userId: userId || "SYSTEM",
            },
        });
    } catch (error) {
        // We don't want to crash the main operation if logging fails,
        // but we should log the error to the console.
        console.error("Failed to create audit log:", error);
    }
}
