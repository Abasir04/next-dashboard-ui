import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch courses for a specific level
export async function GET(
  request: NextRequest,
  { params }: { params: { levelId: string } }
) {
  try {
    const levelId = parseInt(params.levelId);

    // First, get the level name
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      select: { name: true },
    });

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Get all courses for this level
    const courses = await prisma.course.findMany({
      where: {
        level: levelId,
      },
      include: {
        lecturer: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            materials: true,
            registrations: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to match the expected format
    const transformedCourses = courses.map((course) => ({
      id: course.id,
      name: course.name,
      code: course.code,
      level: course.level,
      studentCount: course._count.registrations,
      materialsCount: course._count.materials,
      lecturer: course.lecturer,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));

    return NextResponse.json({
      courses: transformedCourses,
      levelName: level.name,
    });
  } catch (error) {
    console.error("Error fetching level courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch level courses" },
      { status: 500 }
    );
  }
}
