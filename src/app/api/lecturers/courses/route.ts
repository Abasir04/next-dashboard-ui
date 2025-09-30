import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Fetch courses for the current lecturer
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

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        lecturer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get student counts and materials counts for each course
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        // Get student count from course registrations
        const studentCount = await prisma.courseRegistration.count({
          where: {
            courseId: course.id,
            status: "APPROVED",
          },
        });

        // Get materials count
        const materialsCount = await prisma.courseMaterial.count({
          where: {
            courseId: course.id,
          },
        });

        return {
          ...course,
          studentCount,
          materialsCount,
          levels: [`${course.level} Level`], // Convert level to array format
        };
      })
    );

    return NextResponse.json({ courses: coursesWithCounts });
  } catch (error) {
    console.error("Error fetching lecturer courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
