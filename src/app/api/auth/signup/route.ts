import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, title, role } = body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Email regex validation
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Password validation: at least 6 chars and at least one symbol
    const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
    if (password.length < 6 || !symbolRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters long and contain at least one symbol",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      title,
      role,
    });

    // Add to role table
    if (role.toLowerCase() === "lecturer") {
      await prisma.lecturer.create({
        data: {
          lecturerId: `L${user.id}`,
          name: `${firstName} ${lastName}`,
          email,
          photo: null,
          phone: "",
          address: "",
          userId: user.id,
          title,
          role,
        },
      });
    } else if (role.toLowerCase() === "student") {
      const level = await prisma.level.findFirst();
      if (!level) {
        return NextResponse.json(
          { error: "No level exists. Please contact admin." },
          { status: 400 }
        );
      }
      try {
        await prisma.student.create({
          data: {
            studentId: `S${user.id}`,
            name: `${firstName} ${lastName}`,
            email,
            photo: null,
            phone: "",
            grade: 1,
            levelId: level.id,
            address: "",
            userId: user.id,
            title,
            role,
          },
        });
      } catch (err) {
        return NextResponse.json(
          {
            error:
              "Failed to create student. Please check required fields and level.",
          },
          { status: 500 }
        );
      }
    } else if (role.toLowerCase() === "admin") {
      await prisma.admin.create({
        data: {
          userId: user.id,
          title,
          role,
        },
      });
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
