import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

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
  console.log("=== ASSIGNMENTS API POST FUNCTION CALLED ===");
  let body: any = null;
  let user: any = null;

  try {
    console.log("Assignment creation request received");
    user = await getAuthenticatedUser(request);
    console.log("Authenticated user:", user);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    body = await request.json();
    console.log("Request body:", body);
    const { title, description, courseId, startDate, dueDate } = body;
    console.log("Extracted fields:", {
      title,
      description,
      courseId,
      startDate,
      dueDate,
    });

    // Validate required fields
    if (!title || !courseId || !startDate || !dueDate) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Parse and validate courseId
    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId) || parsedCourseId <= 0) {
      console.log("Invalid courseId:", courseId);
      return NextResponse.json(
        { error: "Invalid course ID provided" },
        { status: 400 }
      );
    }
    console.log("Parsed courseId:", parsedCourseId);

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
      console.log("Looking for lecturer with userId:", user.id);
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
      });
      console.log("Found lecturer:", lecturer);

      if (!lecturer) {
        console.log("Lecturer not found for user:", user);
        return NextResponse.json(
          { error: "Lecturer not found" },
          { status: 404 }
        );
      }

      lecturerId = lecturer.id;
    }

    // Verify that the lecturer owns the course and get course details
    console.log(
      "Looking for course with courseId:",
      parsedCourseId,
      "and lecturerId:",
      lecturerId
    );
    const course = await prisma.course.findFirst({
      where: {
        id: parsedCourseId,
        lecturerId: lecturerId,
      },
    });
    console.log("Found course:", course);

    if (!course) {
      console.log("Course not found or permission denied");
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
    // Level grades are 1, 2, 3, 4, 5, 6, 7
    // Map course level to level grade: 100->1, 200->2, 300->3, 400->4, 500->5, 600->6
    const levelGrade = Math.floor(course.level / 100);
    console.log("Course level:", course.level, "-> Level grade:", levelGrade);

    console.log("Looking for level with grade:", levelGrade);
    const level = await prisma.level.findFirst({
      where: {
        grade: levelGrade,
      },
    });
    console.log("Found level:", level);

    if (!level) {
      console.log(
        "Level not found for course level:",
        course.level,
        "grade:",
        levelGrade
      );
      return NextResponse.json(
        {
          error: `Level not found for course level ${course.level} (mapped to grade ${levelGrade})`,
        },
        { status: 400 }
      );
    }

    // Note: Multiple assignments are now allowed per course
    console.log(
      "Allowing multiple assignments per course - no restriction check needed"
    );

    // Create the assignment
    console.log("Creating assignment with data:", {
      title,
      description,
      courseId: parsedCourseId,
      levelId: level.id,
      lecturerId,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      isActive: true,
    });

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        courseId: parsedCourseId,
        levelId: level.id,
        lecturerId,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        isActive: true,
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

    console.log("Assignment created successfully:", assignment);
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
