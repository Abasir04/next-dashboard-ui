import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// GET - Get existing submission link for assignment
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

    const assignmentId = parseInt(params.id);
    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 }
      );
    }

    // Get assignment details
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
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
        level: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to access this assignment
    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
      });

      if (!lecturer || assignment.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Check if assignment is still active and not expired
    const now = new Date();
    const isExpired = now > assignment.dueDate;
    const isActive = assignment.isActive && !isExpired;

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        startDate: assignment.startDate,
        dueDate: assignment.dueDate,
        linkId: assignment.linkId,
        isActive: assignment.isActive,
        isExpired,
        canSubmit: isActive,
        course: assignment.course,
        lecturer: assignment.lecturer,
        level: assignment.level,
      },
      submissionUrl: isActive
        ? `${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/student/assignment/${assignment.linkId}`
        : null,
    });
  } catch (error) {
    console.error("Error fetching assignment submission link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Generate new submission link (regenerate if needed)
export async function POST(
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

    const assignmentId = parseInt(params.id);
    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 }
      );
    }

    // Get assignment details
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
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
        level: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to access this assignment
    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
      });

      if (!lecturer || assignment.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Check if assignment is expired
    const now = new Date();
    const isExpired = now > assignment.dueDate;

    if (isExpired) {
      return NextResponse.json(
        { error: "Cannot generate submission link for expired assignment" },
        { status: 400 }
      );
    }

    // Generate new linkId if needed (assignment already has one, but we can regenerate)
    const newLinkId = assignment.linkId; // Keep existing linkId

    const submissionUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/student/assignment/${newLinkId}`;

    return NextResponse.json({
      message: "Submission link generated successfully",
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        startDate: assignment.startDate,
        dueDate: assignment.dueDate,
        linkId: newLinkId,
        isActive: assignment.isActive,
        isExpired: false,
        canSubmit: true,
        course: assignment.course,
        lecturer: assignment.lecturer,
        level: assignment.level,
      },
      submissionUrl,
    });
  } catch (error) {
    console.error("Error generating assignment submission link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
