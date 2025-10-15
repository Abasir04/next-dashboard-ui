import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all levels with statistics
export async function GET() {
  try {
    const levels = await prisma.level.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        students: {
          select: {
            id: true,
          },
        },
        lecturerLevels: {
          include: {
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            lecturerLevels: true,
            assignments: true,
            exams: true,
            events: true,
            announcements: true,
          },
        },
      },
    });

    // Get course statistics for each level
    const levelsWithStats = await Promise.all(
      levels.map(async (level) => {
        // Count courses for this level (courses have a level field as integer)
        const courseCount = await prisma.course.count({
          where: {
            level: level.id,
          },
        });

        // Count unique lecturers teaching courses for this level
        const lecturersTeachingLevel = await prisma.lecturer.count({
          where: {
            courses: {
              some: {
                level: level.id,
              },
            },
          },
        });

        return {
          ...level,
          courseCount,
          lecturersTeachingLevel,
        };
      })
    );

    return NextResponse.json({ levels: levelsWithStats });
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}
