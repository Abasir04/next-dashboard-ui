import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      title,
      role,
      matricNumber,
      phone,
      address,
      level,
    } = body;

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

    // Phone validation for Nigerian numbers
    if (phone) {
      const phoneRegex = /^(\+234|0)?[789][01]\d{8}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return NextResponse.json(
          { error: "Please enter a valid Nigerian phone number" },
          { status: 400 }
        );
      }
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
          phone: phone || "",
          address: address || "",
          userId: user.id,
          title,
          role,
        },
      });
    } else if (role.toLowerCase() === "student") {
      // Validate level parameter
      if (!level) {
        return NextResponse.json(
          { error: "Level is required for student registration" },
          { status: 400 }
        );
      }

      // Find the level by grade (frontend sends 100-600, map to grades 1-6)
      const levelGrade = parseInt(level) / 100; // Convert 100->1, 200->2, 300->3, 400->4, 500->5, 600->6
      const levelRecord = await prisma.level.findFirst({
        where: { grade: levelGrade },
      });

      if (!levelRecord) {
        return NextResponse.json(
          { error: "Invalid level selected. Please contact admin." },
          { status: 400 }
        );
      }
      try {
        // Enforce surname-first storage for name
        const fullName = `${lastName} ${firstName}`;

        // Require 6-digit matric number
        const matricRegex = /^\d{6}$/;
        if (!matricRegex.test(matricNumber || "")) {
          return NextResponse.json(
            { error: "Matric number must be exactly 6 digits" },
            { status: 400 }
          );
        }

        await prisma.student.create({
          data: {
            matricNumber: matricNumber,
            name: fullName,
            email,
            photo: null,
            phone: phone || "",
            grade: 1,
            levelId: levelRecord.id,
            address: address || "",
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
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
