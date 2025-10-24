import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { nanoid } from "nanoid";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// GET - Fetch all assignments for the current lecturer
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
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
      });

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer not found" },
          { status: 404 }
        );
      }

      whereClause.lecturerId = lecturer.id;
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
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
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new assignment
export async function POST(request: NextRequest) {
  let body: any = null;
  let user: any = null;

  try {
    user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    body = await request.json();
    const {
      title,
      description,
      courseId,
      startDate,
      dueDate,
      lecturerFileUrl,
      lecturerFileName,
    } = body;

    // Validate required fields
    if (!title || !courseId || !startDate || !dueDate) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate description length
    if (description && description.length > 80) {
      return NextResponse.json(
        { error: "Description must be 80 characters or less" },
        { status: 400 }
      );
    }

    // Parse and validate courseId
    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId) || parsedCourseId <= 0) {
      return NextResponse.json(
        { error: "Invalid course ID provided" },
        { status: 400 }
      );
    }

    let lecturerId: number;

    if (user.role === "ADMIN") {
      // For admin, use the lecturerId from the request body
      if (!body.lecturerId) {
        return NextResponse.json(
          { error: "Lecturer ID is required for admin users" },
          { status: 400 }
        );
      }
      lecturerId = body.lecturerId;
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

    // Verify that the lecturer owns the course and get course details
    const course = await prisma.course.findFirst({
      where: {
        id: parsedCourseId,
        lecturerId: lecturerId,
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          error:
            "Course not found or you don't have permission to create assignments for this course",
        },
        { status: 400 }
      );
    }

    // Find the level record based on the course's level number
    // Course levels are 100, 200, 300, 400, 500, 600
    // We need to find a level that corresponds to this course level

    // First try to find a level with the exact course level as name (e.g., "300")
    let level = await prisma.level.findFirst({
      where: {
        name: course.level.toString(),
      },
    });

    // If not found, try to find a level by mapping course level to grade
    // 100->1, 200->2, 300->3, 400->4, 500->5, 600->6
    if (!level) {
      const courseLevelGrade = Math.floor(course.level / 100);

      // Since we don't have a grade field, try to find by name patterns
      // Look for levels that might correspond to this grade
      level = await prisma.level.findFirst({
        where: {
          name: {
            contains: courseLevelGrade.toString(),
          },
        },
      });
    }

    // If still not found, try to find any level that might correspond
    // This is a fallback for cases where levels might have different naming
    if (!level) {
      level = await prisma.level.findFirst({
        orderBy: {
          id: "asc",
        },
      });
    }

    if (!level) {
      return NextResponse.json(
        {
          error:
            "No levels found in database. Please ensure levels are properly seeded.",
        },
        { status: 400 }
      );
    }

    // Parse dates and validate them
    const startDateObj = new Date(startDate);
    const dueDateObj = new Date(dueDate);
    const currentDate = new Date();

    // Check if dates are valid
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid start date format" },
        { status: 400 }
      );
    }

    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid due date format" },
        { status: 400 }
      );
    }

    // Validate that start date is not in the past
    // if (startDateObj < currentDate) {
    //   return NextResponse.json(
    //     { error: "Start date cannot be in the past" },
    //     { status: 400 }
    //   );
    // }

    // Validate that due date is not in the past
    if (dueDateObj < currentDate) {
      return NextResponse.json(
        { error: "Due date cannot be in the past" },
        { status: 400 }
      );
    }

    // Validate that start date is before due date
    if (startDateObj >= dueDateObj) {
      return NextResponse.json(
        { error: "Start date must be before due date" },
        { status: 400 }
      );
    }

    // Note: Multiple assignments are now allowed per course

    // Generate unique linkId for the assignment
    const linkId = nanoid(12);

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        courseId: parsedCourseId,
        levelId: level.id,
        lecturerId,
        startDate: startDateObj,
        dueDate: dueDateObj,
        linkId,
        isActive: true,
        lecturerFileUrl,
        lecturerFileName,
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
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.error("Request body:", body);
    console.error("User:", user);

    // Return detailed error information for debugging
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        type: typeof error,
        body: body,
        user: user,
      },
      { status: 500 }
    );
  }
}
