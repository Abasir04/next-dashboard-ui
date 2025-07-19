import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const { title, role } = await request.json();
    // Validate presence
    if (!title || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    // Validate title and role values
    const allowedTitles = ["mr", "mrs", "miss", "dr", "prof"];
    const allowedRoles = ["admin", "lecturer", "student"];
    if (
      typeof title !== "string" ||
      !allowedTitles.includes(title.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "Select a title or role" },
        { status: 400 }
      );
    }
    if (
      typeof role !== "string" ||
      !allowedRoles.includes(role.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "Select a title or role" },
        { status: 400 }
      );
    }
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { 
        title, 
        role: role.toLowerCase() as Role // Ensure correct enum type
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user details" },
      { status: 500 }
    );
  }
}
