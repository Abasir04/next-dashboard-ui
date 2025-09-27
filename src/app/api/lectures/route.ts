import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { nanoid } from "nanoid";

// POST - Create a new lecture
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, startTime, endTime, linkExpiry } = body;

    // Validate required fields
    if (!courseId || !startTime || !endTime || !linkExpiry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const expiry = new Date(linkExpiry);
    const now = new Date();

    if (start <= now) {
      return NextResponse.json(
        { error: "Start time must be in the future" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Get lecturer ID
    let lecturerId: number;
    if (user.role === "ADMIN") {
      // For admin, we need to get the lecturer ID from the course
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: { lecturerId: true },
      });

      if (!course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }

      lecturerId = course.lecturerId;
    } else {
      // For lecturer, get their ID
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer not found" },
          { status: 404 }
        );
      }

      lecturerId = lecturer.id;

      // Verify the course belongs to this lecturer
      const course = await prisma.course.findFirst({
        where: {
          id: parseInt(courseId),
          lecturerId: lecturerId,
        },
      });

      if (!course) {
        return NextResponse.json(
          { error: "Course not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Generate unique code
    const uniqueCode = nanoid(8);

    // Create lecture
    const lecture = await prisma.lecture.create({
      data: {
        courseId: parseInt(courseId),
        lecturerId,
        uniqueCode,
        startTime: start,
        endTime: end,
        linkExpiry: expiry,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Generate attendance URL
    const attendanceUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/student/attendance/${uniqueCode}`;

    return NextResponse.json({
      success: true,
      lecture: {
        ...lecture,
        attendanceUrl,
      },
    });
  } catch (error) {
    console.error("Error creating lecture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get lectures for the current lecturer
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let whereClause: any = {};

    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer not found" },
          { status: 404 }
        );
      }

      whereClause.lecturerId = lecturer.id;
    }

    const lectures = await prisma.lecture.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            name: true,
          },
        },
        attendances: {
          select: {
            id: true,
            status: true,
            markedAt: true,
            student: {
              select: {
                id: true,
                name: true,
                matricNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    // Add attendance counts and URLs
    const lecturesWithCounts = lectures.map((lecture) => ({
      ...lecture,
      attendanceUrl: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/student/attendance/${lecture.uniqueCode}`,
      presentCount: lecture.attendances.filter((a) => a.status === "PRESENT")
        .length,
      totalStudents: lecture.attendances.length,
    }));

    return NextResponse.json({ lectures: lecturesWithCounts });
  } catch (error) {
    console.error("Error fetching lectures:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
