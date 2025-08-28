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
        title: true,
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

    const body = await request.json();
    const { firstName, lastName, email, title, role } = body as Partial<{
      firstName: string;
      lastName: string;
      email: string;
      title: string;
      role: string;
    }>;

    // Nothing to update
    if (
      firstName === undefined &&
      lastName === undefined &&
      email === undefined &&
      title === undefined &&
      role === undefined
    ) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const allowedTitles = ["mr", "mrs", "miss", "dr", "prof"];
    const allowedRoles = ["admin", "lecturer", "student"];

    const updateData: any = {};

    if (typeof firstName === "string") {
      const trimmed = firstName.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "First name is required" },
          { status: 400 }
        );
      }
      updateData.firstName = trimmed;
    }

    if (typeof lastName === "string") {
      const trimmed = lastName.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "Last name is required" },
          { status: 400 }
        );
      }
      updateData.lastName = trimmed;
    }

    if (typeof email === "string") {
      const trimmed = email.trim().toLowerCase();
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(trimmed)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 }
        );
      }
      // Check uniqueness if email changed
      const existing = await prisma.user.findUnique({
        where: { email: trimmed },
      });
      if (existing && existing.id !== payload.userId) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
      updateData.email = trimmed;
    }

    if (typeof title === "string") {
      if (!allowedTitles.includes(title.toLowerCase())) {
        return NextResponse.json({ error: "Invalid title" }, { status: 400 });
      }
      updateData.title = title.toLowerCase();
    }

    if (typeof role === "string") {
      if (!allowedRoles.includes(role.toLowerCase())) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updateData.role = role.toUpperCase() as Role;
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        title: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user details" },
      { status: 500 }
    );
  }
}
