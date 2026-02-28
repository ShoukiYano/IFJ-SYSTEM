import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const { pathname } = req.nextUrl;

      // テナント専用ログインページは認証なしでアクセス可能にする
      if (pathname.startsWith("/t/") && pathname.endsWith("/login")) {
        return true;
      }

      // それ以外はトークンがあれば認証済みとする
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
