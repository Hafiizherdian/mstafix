import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware untuk file static dan API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Route public yang bisa diakses tanpa login
  const publicPaths = ["/", "/login", "/register", "/setup-admin"];
  if (publicPaths.includes(pathname)) {
    console.log(`Public path allowed: ${pathname}`);
    return NextResponse.next();
  }

  // Cek token
  const token =
    request.cookies.get("authToken")?.value ||
    request.cookies.get("token")?.value;

  console.log(`Simple middleware: ${pathname}, token: ${!!token}`);

  // Special handling untuk admin routes
  if (pathname.startsWith("/admin")) {
    console.log(`Admin route detected: ${pathname}`);
    if (!token) {
      console.log("No token for admin route, redirect to login");
      const loginUrl = new URL("/login", request.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
    console.log("Token found for admin route, allowing access");
    return NextResponse.next();
  }

  // Kalau tidak ada token, redirect ke login
  if (!token) {
    console.log("No token, redirect to login");
    const loginUrl = new URL("/login", request.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // Kalau ada token, allow access (simplified untuk thesis)
  console.log("Token found, allowing access");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\.).*)"],
};
