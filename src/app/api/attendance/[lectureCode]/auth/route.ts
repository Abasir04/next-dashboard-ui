import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST - Authenticate student for attendance
export async function POST(
  request: NextRequest,
  { params }: { params: { lectureCode: string } }
) {
  try {
    const { lectureCode } = params;
    const body = await request.json();
    const { matricNumber, password } = body;

    // Validate input
    if (!matricNumber || !password) {
      return NextResponse.json(
        { error: "Matric number and password are required" },
        { status: 400 }
      );
    }

    // Get the lecture
    const lecture = await prisma.lecture.findUnique({
      where: { uniqueCode: lectureCode },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    // Check if lecture is active
    const now = new Date();
    if (now < lecture.startTime) {
      return NextResponse.json(
        { error: "Lecture has not started yet" },
        { status: 400 }
      );
    }

    if (now > lecture.linkExpiry) {
      return NextResponse.json(
        { error: "Attendance link has expired" },
        { status: 400 }
      );
    }

    // Find student by matric number
    const student = await prisma.student.findUnique({
      where: { matricNumber },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      student.user.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if student is registered for the course
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        courseId: lecture.courseId,
        studentEmail: student.user.email,
        status: "APPROVED",
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "You are not registered for this course" },
        { status: 403 }
      );
    }

    // Check if student has already marked attendance
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        lectureId_studentId: {
          lectureId: lecture.id,
          studentId: student.id,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: "Attendance already marked" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      student: {
        id: student.id,
        name: student.name,
        matricNumber: student.matricNumber,
        email: student.user.email,
      },
    });
  } catch (error) {
    console.error("Error authenticating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
