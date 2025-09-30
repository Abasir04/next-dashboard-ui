import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch students for a specific level
export async function GET(
  request: NextRequest,
  { params }: { params: { levelId: string } }
) {
  try {
    const levelId = parseInt(params.levelId);

    if (isNaN(levelId)) {
      return NextResponse.json({ error: "Invalid level ID" }, { status: 400 });
    }

    // First, get the level name
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      select: { name: true },
    });

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Get all students in this level
    const students = await prisma.student.findMany({
      where: {
        levelId: levelId,
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get courses for each student through CourseRegistration
    const studentsWithCourses = await Promise.all(
      students.map(async (student) => {
        const registrations = await prisma.courseRegistration.findMany({
          where: {
            matricNumber: student.matricNumber,
          },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });

        return {
          ...student,
          courses: registrations.map((reg) => reg.course),
        };
      })
    );

    return NextResponse.json({
      students: studentsWithCourses,
      levelName: level.name,
    });
  } catch (error) {
    console.error("Error fetching level students:", error);
    console.error("Level ID:", params.levelId);
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to fetch level students" },
      { status: 500 }
    );
  }
}
