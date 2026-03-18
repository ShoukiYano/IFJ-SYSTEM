import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        subdomain: { label: "Subdomain", type: "text" },
      },
      async authorize(credentials) {
        try {
          // console.log("[AUTH] Authorize called with email:", credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            // console.log("[AUTH] Missing credentials");
            throw new Error("メールアドレスとパスワードを入力してください");
          }

          const email = credentials.email.trim().toLowerCase();
          // console.log("[AUTH] Normalizing email to:", email);

          // Prisma Client の死活監視
          // console.log("[AUTH] Checking Prisma instance...");
          if (!prisma) {
            console.error("[AUTH] FATAL: Prisma instance is undefined!");
            throw new Error("ERR_DB_INIT_FAILED");
          }
          // console.log("[AUTH] Prisma instance exists. Models:", Object.keys(prisma).filter(k => !k.startsWith("_")));

          // console.log("[AUTH] START: prisma.user.findUnique for email:", email);
          const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
          }).catch(dbErr => {
            console.error("[AUTH] CRITICAL DB ERROR during findUnique:", dbErr);
            throw dbErr;
          });
          // console.log("[AUTH] END: prisma.user.findUnique, user found:", !!user);

          if (!user) {
            // console.log("[AUTH] User not found in DB:", email);
            throw new Error("ERR_USER_NOT_FOUND");
          }

          // テナント検証
          if (credentials.subdomain && user.role !== "SYSTEM_ADMIN") {
            const loginSubdomain = credentials.subdomain.trim().toLowerCase();
            const userSubdomain = user.tenant?.subdomain?.toLowerCase();
            // console.log("[AUTH] Tenant check - login subdomain:", loginSubdomain, "user's subdomain:", userSubdomain);
            if (loginSubdomain !== userSubdomain) {
              // console.log("[AUTH] Tenant mismatch! Blocking login for non-admin.");
              throw new Error("ERR_USER_NOT_FOUND");
            }
          } else if (credentials.subdomain && user.role === "SYSTEM_ADMIN") {
            // console.log("[AUTH] System admin login via tenant page - bypassing subdomain check");
          }

          // console.log("[AUTH] User data:", { email: user.email, role: user.role, hasTenant: !!user.tenant });

          if (!user.password) {
            // console.log("[AUTH] User has no password set in DB");
            throw new Error("ERR_NO_PASSWORD");
          }

          // console.log("[AUTH] Comparing with bcrypt...");
          const isValid = await bcrypt.compare(credentials.password, user.password);
          // console.log("[AUTH] Bcrypt result:", isValid);

          if (!isValid) {
            // console.log("[AUTH] Password mismatch for:", email);
            throw new Error("ERR_INVALID_PASSWORD");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenantId,
            tenantSubdomain: user.tenant?.subdomain,
            role: user.role,
            tosAccepted: !!(user as any).tosAcceptedAt,
            hasInvoiceFeature: (user.tenant as any)?.hasInvoiceFeature ?? true,
            hasAttendanceFeature: (user.tenant as any)?.hasAttendanceFeature ?? false,
          };
        } catch (error: any) {
          console.error("[AUTH] TOP-LEVEL ERROR in authorize:", error);
          // NextAuth にエラーを伝えるために re-throw するか、特定の値を返す
          // res.error にメッセージを乗せるために、独自のキーを投げる
          if (error.message.startsWith("ERR_")) throw error;
          throw new Error("ERR_INTERNAL_SERVER_ERROR");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin-portal",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.tenantSubdomain = (user as any).tenantSubdomain;
        token.role = (user as any).role;
        token.tosAccepted = (user as any).tosAccepted;
        token.hasInvoiceFeature = (user as any).hasInvoiceFeature;
        token.hasAttendanceFeature = (user as any).hasAttendanceFeature;
      }
      if (trigger === "update" && session?.tosAccepted !== undefined) {
        token.tosAccepted = session.tosAccepted;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantSubdomain = token.tenantSubdomain;
        (session.user as any).role = token.role;
        (session.user as any).tosAccepted = token.tosAccepted;
        (session.user as any).hasInvoiceFeature = token.hasInvoiceFeature;
        (session.user as any).hasAttendanceFeature = token.hasAttendanceFeature;
      }
      return session;
    },
  },
};
