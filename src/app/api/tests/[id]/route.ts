import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const testId = parseInt(params.id);
    if (isNaN(testId)) {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
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
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Check access permissions
    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!lecturer || test.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error("Error fetching test:", error);
    return NextResponse.json(
      { error: "Failed to fetch test" },
      { status: 500 }
    );
  }
}

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

    const testId = parseInt(params.id);
    if (isNaN(testId)) {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
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
      isPublished,
      courseId,
      levelId,
    } = body;

    // Normalize levelId: frontend may send 100/200/..., but DB expects Level.id (1..6)
    let normalizedLevelId: number | undefined = undefined;
    if (levelId !== undefined && levelId !== null && levelId !== "") {
      const parsedLevelId = parseInt(levelId);
      if (isNaN(parsedLevelId)) {
        return NextResponse.json({ error: "Invalid levelId" }, { status: 400 });
      }
      if (parsedLevelId >= 100) {
        // DB stores Level.name as "100", "200", ... and ids 1..6
        const expectedName = parsedLevelId.toString();
        let level = await prisma.level.findUnique({
          where: { name: expectedName },
          select: { id: true },
        });
        if (!level) {
          const grade = Math.floor(parsedLevelId / 100).toString();
          level = await prisma.level.findFirst({
            where: { name: { contains: grade } },
            select: { id: true },
          });
        }
        if (!level) {
          return NextResponse.json(
            { error: `Level not found for name ${expectedName}` },
            { status: 400 }
          );
        }
        normalizedLevelId = level.id;
      } else {
        normalizedLevelId = parsedLevelId;
      }
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

    // Check if test exists and belongs to lecturer
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
      select: { lecturerId: true },
    });

    if (!existingTest) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (user.role === "LECTURER" && existingTest.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update test with questions
    const test = await prisma.$transaction(async (tx) => {
      // First, delete existing questions
      await tx.testQuestion.deleteMany({
        where: { testId: testId },
      });

      // Update the test
      await tx.test.update({
        where: { id: testId },
        data: {
          title,
          description,
          timeLimit: timeLimit ? parseInt(timeLimit) : null,
          startDate: startDate ? new Date(startDate) : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          courseId: courseId ? parseInt(courseId) : undefined,
          levelId:
            normalizedLevelId !== undefined ? normalizedLevelId : undefined,
          allowViewScore: allowViewScore !== false,
          isPublished: isPublished || false,
        },
      });

      // Create new questions if provided
      if (questions && Array.isArray(questions)) {
        await tx.testQuestion.createMany({
          data: questions.map((q: any) => ({
            testId: testId,
            question: q.question,
            type: q.type,
            options: q.options || [],
            correct: q.correct || [],
            required: q.required || false,
            points: q.points || 1,
            order: q.order || 1,
          })),
        });
      }

      // Return the updated test with all relations
      return await tx.test.findUnique({
        where: { id: testId },
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
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error("Error updating test:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      testId: params.id,
    });
    return NextResponse.json(
      {
        error: "Failed to update test",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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

    const testId = parseInt(params.id);
    if (isNaN(testId)) {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
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

    // Check if test exists and belongs to lecturer
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
      select: { lecturerId: true },
    });

    if (!existingTest) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (user.role === "LECTURER" && existingTest.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete test (cascade will handle questions and responses)
    await prisma.test.delete({
      where: { id: testId },
    });

    return NextResponse.json({ message: "Test deleted successfully" });
  } catch (error) {
    console.error("Error deleting test:", error);
    return NextResponse.json(
      { error: "Failed to delete test" },
      { status: 500 }
    );
  }
}
