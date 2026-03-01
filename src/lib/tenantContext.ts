import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

/**
 * Server-side utility to get the current tenant context.
 * Can be used in Server Components, API Routes, and Server Actions.
 */
import { cookies } from "next/headers";

export async function getTenantContext() {
  const session = await getServerSession(authOptions) as any;

  if (!session || !session.user) {
    return null;
  }

  const realTenantId = session.user.tenantId as string;
  const realRole = session.user.role as string;
  const realUserId = session.user.id as string;

  // Impersonation support for SYSTEM_ADMIN
  if (realRole === "SYSTEM_ADMIN") {
    const impTenantId = cookies().get("x-impersonate-tenant-id")?.value;
    const impUserId = cookies().get("x-impersonate-user-id")?.value;

    if (impTenantId) {
      return {
        userId: impUserId || realUserId,
        tenantId: impTenantId,
        role: "TENANT_ADMIN", // Assume admin role during impersonation
        user: session.user,
        isImpersonating: true,
      };
    }
  }

  return {
    userId: realUserId,
    tenantId: realTenantId,
    role: realRole,
    user: session.user,
    isImpersonating: false,
  };
}

/**
 * Stronger version of getTenantContext that redirects to login if not authenticated.
 */
export async function requireTenantContext() {
  const context = await getTenantContext();

  if (!context || !context.tenantId) {
    redirect("/login");
  }

  return context;
}
