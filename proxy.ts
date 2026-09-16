import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin pages
  if (pathname.startsWith("/admin")) {
    // Allow the login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Check authentication cookie
    const authCookie =
      request.cookies.get("organizer-auth");

    // If not authenticated, redirect to login
    if (
      !authCookie ||
      authCookie.value !== "authenticated"
    ) {
      const loginUrl = new URL(
        "/admin/login",
        request.url
      );

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};