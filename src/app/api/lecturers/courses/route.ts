import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

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

    // Get lecturer profile
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer profile not found" },
        { status: 404 }
      );
    }

    // Get lecturer's courses
    const courses = await prisma.course.findMany({
      where: { lecturerId: lecturer.id },
      orderBy: {
        name: "asc",
      },
    });

    // Get all levels to map course levels
    const levels = await prisma.level.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Map courses with level information
    const coursesWithLevels = courses.map((course) => ({
      ...course,
      level: levels.find((level) => level.id === course.level) || {
        id: course.level,
        name: `Level ${course.level}`,
      },
    }));

    return NextResponse.json(coursesWithLevels);
  } catch (error) {
    console.error("Error fetching lecturer courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
