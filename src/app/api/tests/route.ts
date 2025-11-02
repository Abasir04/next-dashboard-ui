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

    // Read optional search query
    const { search } = Object.fromEntries(new URL(request.url).searchParams);

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
    // Apply search filter if provided
    if (search && String(search).trim().length > 0) {
      const term = String(search).trim();
      whereClause = {
        AND: [
          whereClause,
          {
            OR: [
              { title: { contains: term, mode: "insensitive" } },
              { description: { contains: term, mode: "insensitive" } },
              {
                course: {
                  is: { name: { contains: term, mode: "insensitive" } },
                },
              },
              {
                course: {
                  is: { code: { contains: term, mode: "insensitive" } },
                },
              },
              {
                level: {
                  is: { name: { contains: term, mode: "insensitive" } },
                },
              },
            ],
          },
        ],
      };
    }

    // For admin, show all tests (no additional whereClause filter)

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
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tests, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
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
    } = body ?? {};

    // Basic validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      );
    }

    const parsedCourseId =
      typeof courseId === "string" ? parseInt(courseId) : courseId;
    const parsedLevelId =
      typeof levelId === "string" ? parseInt(levelId) : levelId;
    const parsedTimeLimit =
      timeLimit === undefined || timeLimit === null
        ? null
        : typeof timeLimit === "string"
        ? parseInt(timeLimit)
        : Number(timeLimit);

    if (!parsedCourseId || !parsedLevelId || !startDate || !dueDate) {
      return NextResponse.json(
        { error: "Course, level, start date, and due date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const due = new Date(dueDate);
    if (isNaN(start.getTime()) || isNaN(due.getTime())) {
      return NextResponse.json(
        { error: "Invalid start or due date" },
        { status: 400 }
      );
    }

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

    // Verify referenced entities (resolve level by id or by numeric name like "400")
    const [courseRecord, levelRecord] = await Promise.all([
      prisma.course.findUnique({
        where: { id: parsedCourseId },
        select: { id: true, level: true, lecturerId: true },
      }),
      prisma.level.findFirst({
        where: {
          OR: [
            { id: parsedLevelId ?? -1 },
            {
              name:
                typeof levelId === "string" ? levelId : String(parsedLevelId),
            },
          ],
        },
        select: { id: true, name: true },
      }),
    ]);

    if (!courseRecord) {
      return NextResponse.json(
        { error: "courseId does not exist" },
        { status: 400 }
      );
    }
    if (!levelRecord) {
      return NextResponse.json(
        { error: "levelId does not exist" },
        { status: 400 }
      );
    }
    // course.level is numeric like 100/200; Level.name is string like "100"
    if (courseRecord.level !== Number(levelRecord.name)) {
      return NextResponse.json(
        { error: "Selected course does not belong to the selected level" },
        { status: 400 }
      );
    }
    if (courseRecord.lecturerId !== lecturer.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not assigned to this course" },
        { status: 403 }
      );
    }

    // Create test with questions
    const test = await prisma.test.create({
      data: {
        title,
        description,
        lecturerId: lecturer.id,
        courseId: parsedCourseId,
        levelId: levelRecord.id,
        startDate: start,
        dueDate: due,
        shareToken,
        timeLimit: parsedTimeLimit,
        allowViewScore: allowViewScore !== false,
        questions: {
          create: questions.map((q: any, index: number) => ({
            question: String(q.question ?? "").trim(),
            type: q.type,
            options: Array.isArray(q.options) ? q.options : [],
            correct: Array.isArray(q.correct) ? q.correct : [],
            required: Boolean(q.required),
            order: index + 1,
            points: typeof q.points === "number" ? q.points : 1,
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

    return NextResponse.json(test, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    // Prisma known errors mapping
    const code = error?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "Duplicate value" }, { status: 409 });
    }
    if (code === "P2003") {
      return NextResponse.json(
        { error: "Invalid reference: courseId or levelId does not exist" },
        { status: 400 }
      );
    }
    if (code === "P2000" || code === "P2001" || code === "P2009") {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 }
      );
    }
    console.error("Error creating test:", error);
    return NextResponse.json(
      { error: "Failed to create test" },
      { status: 500 }
    );
  }
}
