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
      },
      async authorize(credentials) {
        // --- TEMPORARY TEST ACCOUNT ---
        if (credentials?.email === "test@example.com" && credentials?.password === "test123") {
          console.log("[AUTH] Test login successful");
          return {
            id: "test-user-id",
            email: "test@example.com",
            name: "Test User",
            role: "SYSTEM_ADMIN",
            tosAccepted: true,
          };
        }
        // ------------------------------

        console.log("[AUTH] Authorize called with email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials");
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        });

        if (!user) {
          console.log("[AUTH] User not found in DB:", credentials.email);
          throw new Error("ユーザー名またはパスワードが正しくありません");
        }

        console.log("[AUTH] User found, comparing password...");

        if (!user.password) {
          console.log("[AUTH] User has no password set");
          throw new Error("ユーザー名またはパスワードが正しくありません");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log("[AUTH] Password valid:", isValid);

        if (!isValid) {
          console.log("[AUTH] Password mismatch");
          throw new Error("ユーザー名またはパスワードが正しくありません");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          tenantSubdomain: user.tenant?.subdomain,
          role: user.role,
          tosAccepted: !!(user as any).tosAcceptedAt,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.tenantSubdomain = (user as any).tenantSubdomain;
        token.role = (user as any).role;
        token.tosAccepted = (user as any).tosAccepted;
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
      }
      return session;
    },
  },
};
