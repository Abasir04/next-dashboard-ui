import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// POST /api/course-registration - Create a registration link
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user || (user.role !== "LECTURER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Get the lecturer ID for the current user
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: payload.userId },
      select: { id: true, name: true, email: true },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer profile not found" },
        { status: 404 }
      );
    }

    // Verify course exists and belongs to lecturer
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        lecturerId: lecturer.id,
      },
      include: {
        lecturer: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Use the course's level directly (100-600 system)
    // No need to find a Level record since we're using the 100-600 system

    // If an active, non-expired link already exists for this course + lecturer, reuse it
    const now = new Date();
    const existingActiveLink = await prisma.courseRegistrationLink.findFirst({
      where: {
        courseId: courseId,
        lecturerId: lecturer.id,
        isActive: true,
        expiresAt: { gt: now },
      },
      include: {
        course: true,
        lecturer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingActiveLink) {
      const origin =
        request.nextUrl?.origin ||
        `${request.headers.get("x-forwarded-proto") || "http"}://${
          request.headers.get("host") || "localhost:3000"
        }`;
      return NextResponse.json({
        link: existingActiveLink,
        registrationUrl: `${origin}/register/${existingActiveLink.id}`,
        reused: true,
      });
    }

    // Otherwise, create a new registration link (expires in 1 month)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const registrationLink = await prisma.courseRegistrationLink.create({
      data: {
        courseId: courseId,
        lecturerId: lecturer.id,
        level: course.level,
        expiresAt: expiresAt,
      },
      include: {
        course: true,
        lecturer: true,
      },
    });

    const origin =
      request.nextUrl?.origin ||
      `${request.headers.get("x-forwarded-proto") || "http"}://${
        request.headers.get("host") || "localhost:3000"
      }`;
    return NextResponse.json({
      link: registrationLink,
      registrationUrl: `${origin}/register/${registrationLink.id}`,
    });
  } catch (error) {
    console.error("Error creating registration link:", error);
    return NextResponse.json(
      { error: "Failed to create registration link" },
      { status: 500 }
    );
  }
}

// GET /api/course-registration/[linkId] - Get registration link details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json(
        { error: "Registration link ID is required" },
        { status: 400 }
      );
    }

    const registrationLink = await prisma.courseRegistrationLink.findUnique({
      where: { id: linkId },
      include: {
        course: {
          include: {
            lecturer: true,
          },
        },
        lecturer: true,
      },
    });

    if (!registrationLink) {
      return NextResponse.json(
        { error: "Registration link not found" },
        { status: 404 }
      );
    }

    // Check if link is expired
    if (new Date() > registrationLink.expiresAt || !registrationLink.isActive) {
      return NextResponse.json(
        { error: "Registration link has expired or is inactive" },
        { status: 410 }
      );
    }

    return NextResponse.json(registrationLink);
  } catch (error) {
    console.error("Error fetching registration link:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration link" },
      { status: 500 }
    );
  }
}
