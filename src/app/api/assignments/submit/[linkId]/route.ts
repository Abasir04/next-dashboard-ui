import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

// GET - Get assignment details by linkId for submission
export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params;

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    // Get assignment details by linkId
    const assignment = await prisma.assignment.findUnique({
      where: { linkId },
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
            title: true,
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

    // Check if assignment is still active and not expired
    const now = new Date();
    const isExpired = now > assignment.dueDate;
    const isActive = assignment.isActive && !isExpired;

    if (!isActive) {
      return NextResponse.json(
        {
          error: "Assignment submission is no longer available",
          reason: isExpired
            ? "Assignment has expired"
            : "Assignment is inactive",
        },
        { status: 410 }
      );
    }

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
        lecturerFileUrl: assignment.lecturerFileUrl,
        lecturerFileName: assignment.lecturerFileName,
        course: assignment.course,
        lecturer: assignment.lecturer,
        level: assignment.level,
      },
    });
  } catch (error) {
    console.error("Error fetching assignment for submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit assignment
export async function POST(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params;
    const body = await request.json();
    const { matricNumber, password, fileUrl, originalFilename } = body;

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!matricNumber || !password || !fileUrl || !originalFilename) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Authenticate student using matric number and password
    const user = await authenticateUser(matricNumber, password);
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Invalid matric number or password" },
        { status: 401 }
      );
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        matricNumber: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get assignment details by linkId
    const assignment = await prisma.assignment.findUnique({
      where: { linkId },
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

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if student is registered for this course
    const courseRegistration = await prisma.courseRegistration.findFirst({
      where: {
        courseId: assignment.courseId,
        matricNumber: student.matricNumber,
        status: "APPROVED", // Only allow submissions for approved registrations
      },
    });

    if (!courseRegistration) {
      return NextResponse.json(
        {
          error: "Access denied",
          message: "You are not registered for this course.",
        },
        { status: 403 }
      );
    }

    // Check if assignment is still active and not expired
    const now = new Date();
    const isExpired = now > assignment.dueDate;
    const isActive = assignment.isActive && !isExpired;

    if (!isActive) {
      return NextResponse.json(
        {
          error: "Assignment submission is no longer available",
          reason: isExpired
            ? "Assignment has expired"
            : "Assignment is inactive",
        },
        { status: 410 }
      );
    }

    // Check if student has already submitted for this assignment
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: assignment.id,
        studentId: student.id,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "You have already submitted this assignment" },
        { status: 409 }
      );
    }

    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignment.id,
        studentId: student.id,
        fileUrl,
        fileName: originalFilename, // Use originalFilename as fileName
        originalFilename,
      },
      include: {
        assignment: {
          select: {
            title: true,
            course: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Assignment submitted successfully",
      submission: {
        id: submission.id,
        assignmentTitle: submission.assignment.title,
        courseName: submission.assignment.course.name,
        courseCode: submission.assignment.course.code,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json(
      { error: "Failed to submit assignment" },
      { status: 500 }
    );
  }
}
