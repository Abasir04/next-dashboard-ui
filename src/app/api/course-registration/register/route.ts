import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

// POST /api/course-registration/register - Register a student for a course
export async function POST(request: NextRequest) {
  try {
    const { linkId, matricNumber, password } = await request.json();

    if (!linkId || !matricNumber || !password) {
      return NextResponse.json(
        { error: "Matric number and password are required" },
        { status: 400 }
      );
    }

    // Validate matric number (exactly 6 digits)
    const matricRegex = /^\d{6}$/;
    if (!matricRegex.test(matricNumber)) {
      return NextResponse.json(
        { error: "Matric number must be exactly 6 digits" },
        { status: 400 }
      );
    }

    // Authenticate student using matric number and password
    const user = await authenticateUser(matricNumber, password);
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Invalid matric number or password" },
        { status: 401 }
      );
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        matricNumber: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get registration link details
    const registrationLink = await prisma.courseRegistrationLink.findUnique({
      where: { id: linkId },
      include: {
        course: true,
      },
    });

    if (!registrationLink) {
      return NextResponse.json(
        { error: "Registration link not found" },
        { status: 404 }
      );
    }

    // Check if link is still valid
    if (new Date() > registrationLink.expiresAt || !registrationLink.isActive) {
      return NextResponse.json(
        { error: "Registration link has expired or is inactive" },
        { status: 410 }
      );
    }

    // Check if student is already registered for this course
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: {
        linkId: linkId,
        matricNumber: matricNumber,
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "You have already registered for this course" },
        { status: 409 }
      );
    }

    // Create registration (auto-approve upon successful submission)
    const registration = await prisma.courseRegistration.create({
      data: {
        linkId: linkId,
        courseId: registrationLink.courseId,
        studentName: student.name,
        studentEmail: student.email,
        studentPhone: student.phone,
        matricNumber: student.matricNumber,
        level: registrationLink.level,
        status: "APPROVED",
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json({
      message: "Registration submitted successfully",
      registration: {
        id: registration.id,
        courseName: registration.course?.name || "",
        level: registration.level,
        status: registration.status,
      },
    });
  } catch (error) {
    console.error("Error registering student:", error);
    return NextResponse.json(
      { error: "Failed to register for course" },
      { status: 500 }
    );
  }
}
