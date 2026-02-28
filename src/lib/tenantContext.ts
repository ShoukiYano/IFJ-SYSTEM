import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

/**
 * Server-side utility to get the current tenant context.
 * Can be used in Server Components, API Routes, and Server Actions.
 */
export async function getTenantContext() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  return {
    userId: (session.user as any).id as string,
    tenantId: (session.user as any).tenantId as string,
    role: (session.user as any).role as string,
    user: session.user,
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
