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
      // For lecturers, get their associated levels
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          lecturerLevels: {
            select: {
              levelId: true,
            },
          },
        },
      });

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer profile not found" },
          { status: 404 }
        );
      }

      // Get announcements for levels that this lecturer teaches
      const levelIds = lecturer.lecturerLevels.map((ll) => ll.levelId);
      whereClause = {
        levelId: {
          in: levelIds,
        },
      };
    }
    // For admin, show all announcements (no whereClause filter)

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: {
        level: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
