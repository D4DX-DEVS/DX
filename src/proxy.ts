import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

/**
 * Optimistic gate for /admin: only checks the signed cookie (no database).
 * Every admin page and server action still calls requireAdmin() before touching data.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const onLogin = pathname === "/admin/login";

  // The login page itself redirects signed-in admins after a database check, so a revoked
  // but still-signed cookie cannot bounce between /admin and /admin/login.
  if (!session && !onLogin) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
