import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all lecturers
export async function GET() {
  try {
    const lecturers = await prisma.lecturer.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            level: true,
          },
        },
        lecturerLevels: {
          include: {
            level: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            courses: true,
            lecturerLevels: true,
            assignments: true,
            materials: true,
            lectures: true,
            exams: true,
          },
        },
      },
    });

    return NextResponse.json({ lecturers });
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturers" },
      { status: 500 }
    );
  }
}
