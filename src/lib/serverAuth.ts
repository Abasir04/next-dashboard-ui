import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { prisma } from "./prisma";

export interface AuthenticatedUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        title: true,
        role: true,
      },
    });

    // Validate that the token role matches the database role
    if (user && payload.role !== user.role) {
      console.warn(
        `Role mismatch detected: token role ${payload.role} vs database role ${user.role} for user ${user.id}`
      );
      return null; // Force re-authentication
    }

    // Block deactivated lecturers
    if (user?.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
        select: { role: true },
      });
      if (lecturer?.role === "DEACTIVATED") {
        return null;
      }
    }

    return user;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

export async function requireAuth(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

export function createLogoutResponse() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear the authentication cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Expire immediately
  });

  return response;
}
