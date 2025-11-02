import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "LECTURER") {
      return NextResponse.json({ error: "Only lecturers can deactivate account" }, { status: 403 });
    }

    // Mark the lecturer as deactivated by updating their role field to a sentinel value
    // and scramble the user's password to prevent further logins.
    await prisma.$transaction(async (tx) => {
      await tx.lecturer.update({
        where: { userId: user.id },
        data: { role: "DEACTIVATED" },
      });

      // Scramble password to make sign-in impossible even if token leaks
      const randomHash = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await tx.user.update({
        where: { id: user.id },
        data: { password: randomHash },
      });
    });

    const response = NextResponse.json({ success: true }, { status: 200 });
    // Clear auth cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to deactivate account" }, { status: 500 });
  }
}


