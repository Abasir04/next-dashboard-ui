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

    // Get lecturer's courses with related counts
    const courses = await prisma.course.findMany({
      where: { lecturerId: lecturer.id },
      include: {
        lecturer: {
          select: { name: true, email: true },
        },
        registrations: {
          where: { status: "APPROVED" },
          select: { id: true },
        },
        _count: {
          select: { materials: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get all levels to map course levels
    const levels = await prisma.level.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Map courses with level information and computed counts
    const coursesWithLevels = courses.map((course) => {
      // Map course.level numeric (e.g., 100) to the actual Level entity
      // Seed shows Level.name is like "100", not "100 Level"
      const expectedName = course.level.toString();
      let levelMatch = levels.find((lvl) => lvl.name === expectedName);
      if (!levelMatch) {
        const grade = Math.floor(course.level / 100).toString();
        levelMatch = levels.find((lvl) => lvl.name.includes(grade));
      }
      const levelObj = levelMatch || {
        id: Math.floor(course.level / 100),
        name: expectedName,
      };

      const studentCount = course.registrations.length;
      const materialsCount = course._count.materials;

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        level: levelObj,
        lecturer: course.lecturer,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        studentCount,
        materialsCount,
      };
    });

    return NextResponse.json(
      { courses: coursesWithLevels },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching lecturer courses:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    // Return more detailed error in development
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch courses";
    const errorDetails =
      process.env.NODE_ENV === "production"
        ? {}
        : {
            details: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
          };

    return NextResponse.json(
      { error: "Failed to fetch courses", ...errorDetails },
      { status: 500 }
    );
  }
}
