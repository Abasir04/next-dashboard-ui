import { NextRequest } from "next/server";
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
