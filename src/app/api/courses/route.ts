import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/courses - Get all courses with student counts
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
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
        materials: {
          select: { id: true },
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

    return NextResponse.json(coursesWithStudentCounts);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
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

    const { name, code, level } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    if (!code || code.trim() === "") {
      return NextResponse.json(
        { error: "Course code is required" },
        { status: 400 }
      );
    }

    if (!level || ![100, 200, 300, 400, 500, 600].includes(level)) {
      return NextResponse.json(
        { error: "Level must be 100, 200, 300, 400, 500, or 600" },
        { status: 400 }
      );
    }

    // Get the lecturer ID for the current user
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer profile not found" },
        { status: 404 }
      );
    }

    // Check if course name already exists
    const existingCourseByName = await prisma.course.findUnique({
      where: { name: name.trim() },
    });

    if (existingCourseByName) {
      return NextResponse.json(
        { error: "Course with this name already exists" },
        { status: 409 }
      );
    }

    // Check if course code already exists
    const existingCourseByCode = await prisma.course.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existingCourseByCode) {
      return NextResponse.json(
        { error: "Course with this code already exists" },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        level: level,
        lecturerId: lecturer.id,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}

// PUT /api/courses - Update a course
export async function PUT(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const { name, code, level } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    if (!code || code.trim() === "") {
      return NextResponse.json(
        { error: "Course code is required" },
        { status: 400 }
      );
    }

    if (!level || ![100, 200, 300, 400, 500, 600].includes(level)) {
      return NextResponse.json(
        { error: "Level must be 100, 200, 300, 400, 500, or 600" },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if another course with the same name exists (excluding current course)
    const duplicateCourseByName = await prisma.course.findFirst({
      where: {
        name: name.trim(),
        id: { not: parseInt(courseId) },
      },
    });

    if (duplicateCourseByName) {
      return NextResponse.json(
        { error: "Course with this name already exists" },
        { status: 409 }
      );
    }

    // Check if another course with the same code exists (excluding current course)
    const duplicateCourseByCode = await prisma.course.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        id: { not: parseInt(courseId) },
      },
    });

    if (duplicateCourseByCode) {
      return NextResponse.json(
        { error: "Course with this code already exists" },
        { status: 409 }
      );
    }

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(courseId) },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        level: level,
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses - Delete a course
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      include: {
        lessons: true,
        exams: true,
        assignments: true,
        results: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course has associated data
    if (
      course.lessons.length > 0 ||
      course.exams.length > 0 ||
      course.assignments.length > 0 ||
      course.results.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete course with associated lessons, exams, assignments, or results",
        },
        { status: 409 }
      );
    }

    await prisma.course.delete({
      where: { id: parseInt(courseId) },
    });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
