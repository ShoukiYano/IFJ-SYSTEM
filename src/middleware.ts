import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as any;

    // 1. 公開パスの場合は何もしない (authorized callback で既に true を返している)
    if (
      pathname.startsWith("/admin-portal") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/tos") ||
      (pathname.startsWith("/t/") && pathname.endsWith("/login"))
    ) {
      return NextResponse.next();
    }

    // 2. 利用規約同意チェック (認証済みユーザーのみ)
    // システム管理者も含めて同意を求めるか、除外するか判断が必要ですが、
    // ここでは "/tos" 以外の全パスで未同意ならリダイレクト
    if (token && !token.tosAccepted && pathname !== "/tos") {
      return NextResponse.redirect(new URL("/tos", req.url));
    }

    // 3. システム管理者限定パスのチェック
    if (pathname.startsWith("/admin") && token?.role !== "SYSTEM_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 4. テナント情報の整合性チェック
    if (pathname.startsWith("/t/")) {
      const urlSubdomain = pathname.split("/")[2];
      const userSubdomain = token?.tenantSubdomain;

      if (userSubdomain && urlSubdomain !== userSubdomain && token?.role !== "SYSTEM_ADMIN") {
        // システム管理者は全テナントを跨げるように除外、一般は拒否
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // 公開パスは常に許可
        if (
          pathname.startsWith("/admin-portal") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/tos") ||
          (pathname.startsWith("/t/") && pathname.endsWith("/login"))
        ) {
          return true;
        }

        // それ以外は認証必須
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
