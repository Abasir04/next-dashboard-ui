import { NextRequest } from "next/server";

/**
 * Get the proper base URL for the application
 * This function tries multiple methods to determine the correct base URL
 * in both development and production environments
 */
export function getBaseUrl(request: NextRequest): string {
  // First try the environment variable
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Try to get from request URL origin
  if (request.nextUrl?.origin) {
    return request.nextUrl.origin;
  }

  // Try to get from request headers (production)
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host");
  if (host) {
    return `${protocol}://${host}`;
  }

  // Fallback to localhost for development
  return "http://localhost:3000";
}
