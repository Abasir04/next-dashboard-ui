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

    let lecturerId: number;

    if (user.role === "ADMIN") {
      // For admin, get all students with course registrations
      const uniqueStudents = await prisma.courseRegistration.findMany({
        where: {
          status: "APPROVED",
        },
        select: {
          studentEmail: true,
          matricNumber: true,
        },
        distinct: ["studentEmail", "matricNumber"],
      });

      return NextResponse.json({ count: uniqueStudents.length });
    } else {
      // For lecturer, get students registered to their courses
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

      lecturerId = lecturer.id;

      // Get unique students registered to this lecturer's courses
      const uniqueStudents = await prisma.courseRegistration.findMany({
        where: {
          status: "APPROVED",
          course: {
            lecturerId: lecturerId,
          },
        },
        select: {
          studentEmail: true,
          matricNumber: true,
        },
        distinct: ["studentEmail", "matricNumber"],
      });

      return NextResponse.json({ count: uniqueStudents.length });
    }
  } catch (error) {
    console.error("Error fetching lecturer student count:", error);
    return NextResponse.json(
      { error: "Failed to fetch student count" },
      { status: 500 }
    );
  }
}
