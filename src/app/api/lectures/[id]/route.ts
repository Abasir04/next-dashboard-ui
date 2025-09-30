import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Get a single lecture
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = params;
    const lectureId = parseInt(id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: "Invalid lecture ID" },
        { status: 400 }
      );
    }

    const lecture = await prisma.lecture.findFirst({
      where: {
        id: lectureId,
        ...(user.role === "LECTURER"
          ? {
              lecturer: {
                userId: user.id,
              },
            }
          : {}),
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: "Lecture not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ lecture });
  } catch (error) {
    console.error("Error fetching lecture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a lecture
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = params;
    const lectureId = parseInt(id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: "Invalid lecture ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { startTime, endTime, linkExpiry } = body;

    // Validate required fields
    if (!startTime || !endTime || !linkExpiry) {
      return NextResponse.json(
        { error: "Start time, end time, and link expiry are required" },
        { status: 400 }
      );
    }

    // Validate that link expiry is after start time
    const startTimeDate = new Date(startTime);
    const linkExpiryDate = new Date(linkExpiry);

    if (linkExpiryDate <= startTimeDate) {
      return NextResponse.json(
        { error: "Link expiry must be after start time" },
        { status: 400 }
      );
    }

    // Check if lecture exists and user has access
    const existingLecture = await prisma.lecture.findFirst({
      where: {
        id: lectureId,
        ...(user.role === "LECTURER"
          ? {
              lecturer: {
                userId: user.id,
              },
            }
          : {}),
      },
    });

    if (!existingLecture) {
      return NextResponse.json(
        { error: "Lecture not found or access denied" },
        { status: 404 }
      );
    }

    // Update the lecture
    const updatedLecture = await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        linkExpiry: new Date(linkExpiry),
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lecture updated successfully",
      lecture: updatedLecture,
    });
  } catch (error) {
    console.error("Error updating lecture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lecture
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = params;
    const lectureId = parseInt(id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: "Invalid lecture ID" },
        { status: 400 }
      );
    }

    // Get the lecture
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    // Check if user has access to this lecture
    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!lecturer || lecture.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Delete all attendance records first (cascade delete)
    await prisma.attendance.deleteMany({
      where: { lectureId: lectureId },
    });

    // Delete the lecture
    await prisma.lecture.delete({
      where: { id: lectureId },
    });

    return NextResponse.json({
      success: true,
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
