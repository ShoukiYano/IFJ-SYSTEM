import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const { pathname } = req.nextUrl;

      // 1. 公開パスの許可 (ログイン, ユーザー登録, テナント個別ログイン)
      if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/tos") ||
        (pathname.startsWith("/t/") && pathname.endsWith("/login"))
      ) {
        return true;
      }

      // 2. 認証チェック
      if (!token) return false;

      // 3. 利用規約同意チェック (初回のみ)
      if (!(token as any).tosAccepted && pathname !== "/tos") {
        // middleware 内でリダイレクトを返す場合は return false にして redirect プロパティを使うか
        // または authorized で false を返してログイン画面へ戻す。
        // ここでは一旦権限なしとして扱う。
        return false;
      }

      // 4. システム管理者限定パスのチェック
      if (pathname.startsWith("/admin") && token.role !== "SYSTEM_ADMIN") {
        return false;
      }

      // 4. テナント情報の整合性チェック (URLベースの場合)
      // 将来的にサブドメインやパスで他社のデータにアクセスしようとした場合をガード
      if (pathname.startsWith("/t/")) {
        const urlSubdomain = pathname.split("/")[2];
        const userSubdomain = (token as any).tenantSubdomain; // authOptions で追加が必要

        // 開発中は緩めにするか、サブドメインが一致する場合のみ許可
        if (userSubdomain && urlSubdomain !== userSubdomain) {
          return false;
        }
      }

      return true;
    },
  },
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
