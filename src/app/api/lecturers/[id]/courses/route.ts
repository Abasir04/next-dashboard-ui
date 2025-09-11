import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/lecturers/[id]/courses - Get courses for a specific lecturer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const lecturerId = parseInt(params.id);
    if (isNaN(lecturerId)) {
      return NextResponse.json(
        { error: "Invalid lecturer ID" },
        { status: 400 }
      );
    }

    // Check if user is admin or the lecturer themselves
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, lecturer: { select: { id: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Allow access if user is admin or the lecturer themselves
    const isAdmin = user.role === "ADMIN";
    const isLecturer = user.lecturer?.id === lecturerId;

    if (!isAdmin && !isLecturer) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify lecturer exists
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      select: { id: true, name: true, email: true },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer not found" },
        { status: 404 }
      );
    }

    // Fetch courses for this lecturer
    const courses = await prisma.course.findMany({
      where: { lecturerId: lecturerId },
      include: {
        lecturer: {
          select: {
            name: true,
            email: true,
          },
        },
        registrations: {
          where: {
            status: "APPROVED",
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: { materials: true },
        },
        lessons: {
          include: {
            level: {
              select: {
                name: true,
                students: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const coursesWithStudentCounts = courses.map((course) => {
      // Calculate total students registered for this course
      const studentCount = course.registrations.length;

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        level: course.level,
        lecturer: course.lecturer,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        studentCount,
        materialsCount: course._count.materials,
        levels: course.lessons.map((lesson) => lesson.level.name),
      };
    });

    return NextResponse.json({
      lecturer,
      courses: coursesWithStudentCounts,
    });
  } catch (error) {
    console.error("Error fetching lecturer courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturer courses" },
      { status: 500 }
    );
  }
}
