import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Define protected routes that require authentication
const protectedRoutes = [
  "/home",
  "/admin",
  "/lecturer",
  "/student",
  "/parent",
  "/profile",
  "/settings",
  "/list",
];

// Define public routes that don't require authentication
const publicRoutes = ["/", "/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // If it's not a protected route, allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get("token")?.value;

  // If no token, redirect to auth page
  if (!token) {
    const authUrl = new URL("/auth", request.url);
    return NextResponse.redirect(authUrl);
  }

  // Verify the token
  const payload = verifyToken(token);

  // If token is invalid, redirect to auth page
  if (!payload) {
    const authUrl = new URL("/auth", request.url);
    return NextResponse.redirect(authUrl);
  }

  // Token is valid, allow access
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
