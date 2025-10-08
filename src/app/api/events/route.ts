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

    let whereClause: any = {};

    if (user.role === "LECTURER") {
      // For lecturers, only show events related to their courses
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

      // Get events that are either:
      // 1. General events (no specific lecturer)
      // 2. Events related to this lecturer's courses
      whereClause = {
        OR: [
          { lecturerId: null }, // General events
          { lecturerId: lecturer.id }, // Lecturer's specific events
          {
            courses: {
              some: {
                lecturerId: lecturer.id,
              },
            },
          }, // Events related to lecturer's courses
        ],
      };
    }
    // For admin, show all events (no whereClause filter)

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        level: true,
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
