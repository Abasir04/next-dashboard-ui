import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/course-registration/register - Register a student for a course
export async function POST(request: NextRequest) {
  try {
    const { linkId, studentName, studentEmail, studentPhone, matricNumber } =
      await request.json();

    if (
      !linkId ||
      !studentName ||
      !studentEmail ||
      !studentPhone ||
      !matricNumber
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(studentEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
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
    const existingRegistration = await (
      prisma as any
    ).courseRegistration.findFirst({
      where: {
        linkId: linkId,
        OR: [{ studentEmail: studentEmail }, { matricNumber: matricNumber }],
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "You have already registered for this course" },
        { status: 409 }
      );
    }

    // Create registration (auto-approve upon successful submission)
    const registration = await (prisma as any).courseRegistration.create({
      data: {
        linkId: linkId,
        courseId: registrationLink.courseId,
        studentName: studentName,
        studentEmail: studentEmail,
        studentPhone: studentPhone,
        matricNumber: matricNumber,
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
        courseName: (registration as any).course?.name || "",
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
