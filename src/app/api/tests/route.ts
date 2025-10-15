import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { randomUUID } from "crypto";

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
      // Get lecturer profile
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

      whereClause = { lecturerId: lecturer.id };
    }
    // For admin, show all tests (no whereClause filter)

    const tests = await prisma.test.findMany({
      where: whereClause,
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      questions,
      timeLimit,
      startDate,
      dueDate,
      allowViewScore,
      courseId,
      levelId,
    } = body;

    // Get lecturer profile
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

    // Generate unique share token
    const shareToken = randomUUID();

    // Validate required fields
    if (!courseId || !levelId || !startDate || !dueDate) {
      return NextResponse.json(
        { error: "Course, level, start date, and due date are required" },
        { status: 400 }
      );
    }

    // Create test with questions
    const test = await prisma.test.create({
      data: {
        title,
        description,
        lecturerId: lecturer.id,
        courseId: parseInt(courseId),
        levelId: parseInt(levelId),
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        shareToken,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        allowViewScore: allowViewScore !== false,
        questions: {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            type: q.type,
            options: q.options || [],
            correct: q.correct || [],
            required: q.required || false,
            order: index + 1,
            points: q.points || 1,
          })),
        },
      },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json(
      { error: "Failed to create test" },
      { status: 500 }
    );
  }
}
