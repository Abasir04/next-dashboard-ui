import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Fetch all students registered for courses taught by the current lecturer
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

    // Get lecturer ID
    let lecturerId: number;
    if (user.role === "ADMIN") {
      // For admin, get all students from all courses
      const registrations = await prisma.courseRegistration.findMany({
        where: {
          status: "APPROVED",
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
              lecturer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          studentName: "asc",
        },
      });

      return NextResponse.json({ students: registrations });
    } else {
      // For lecturer, get their lecturer record
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
      });

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer not found" },
          { status: 404 }
        );
      }

      lecturerId = lecturer.id;
    }

    // Get students registered for courses taught by this lecturer
    const registrations = await prisma.courseRegistration.findMany({
      where: {
        status: "APPROVED",
        course: {
          lecturerId: lecturerId,
        },
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
      orderBy: {
        studentName: "asc",
      },
    });

    return NextResponse.json({ students: registrations });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
