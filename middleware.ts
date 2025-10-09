/* eslint-disable unused-imports/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Define protected routes that require authentication (lecturer/admin only)
const protectedRoutes = [
  "/home",
  "/admin",
  "/lecturer",
  "/profile",
  "/settings",
  "/menu",
  "/list",
];

// Define public routes that don't require authentication
const publicRoutes = ["/", "/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Try to detect namespaced userId from URL: /u/{userId}/...
  // Supports both page routes and API routes
  const namespaceMatch = pathname.match(/^\/(api\/)?u\/(\d+)(\/|$)/);
  const namespacedUserId = namespaceMatch ? Number(namespaceMatch[2]) : null;

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

  // Get the token from cookies (prefer namespaced token if URL contains /u/{userId})
  const tokenCookieName = namespacedUserId
    ? `token_u_${namespacedUserId}`
    : "token";
  const token = request.cookies.get(tokenCookieName)?.value;

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

  // Validate role consistency between token and database
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user || user.role !== payload.role) {
      console.warn(
        `Role mismatch detected: token role ${payload.role} vs database role ${user?.role} for user ${payload.userId}`
      );

      // Clear the invalid token and redirect to auth
      const response = NextResponse.redirect(new URL("/auth", request.url));
      response.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
      });
      return response;
    }

    // If URL is namespaced, ensure token user matches the namespace
    if (namespacedUserId && payload.userId !== namespacedUserId) {
      const response = NextResponse.redirect(new URL("/auth", request.url));
      response.cookies.set(tokenCookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    // Block students from protected dashboard routes
    if (user.role === "STUDENT") {
      const response = NextResponse.redirect(new URL("/auth", request.url));
      response.cookies.set(tokenCookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
      });
      return response;
    }
  } catch (error) {
    console.error("Error validating user role in middleware:", error);
    // If there's an error validating, clear the token and redirect
    const response = NextResponse.redirect(new URL("/auth", request.url));
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });
    return response;
  }

  // Token is valid and role is consistent, allow access
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
