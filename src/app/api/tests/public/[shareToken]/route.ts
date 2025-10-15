import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is student
    if (user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { shareToken } = params;

    // Get test by share token
    const test = await prisma.test.findUnique({
      where: { shareToken },
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

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (!test.isPublished) {
      return NextResponse.json(
        { error: "Test is not published" },
        { status: 400 }
      );
    }

    // Check if test has start date and is available
    if (test.startDate && new Date() < test.startDate) {
      return NextResponse.json(
        { error: "Test is not yet available" },
        { status: 400 }
      );
    }

    // Check if test has due date and is still open
    if (test.dueDate && new Date() > test.dueDate) {
      return NextResponse.json(
        { error: "Test deadline has passed" },
        { status: 400 }
      );
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Check if student has already submitted
    const existingResponse = await prisma.testResponse.findUnique({
      where: {
        testId_studentId: {
          testId: test.id,
          studentId: student.id,
        },
      },
      select: {
        id: true,
        score: true,
        submittedAt: true,
        answers: true,
      },
    });

    return NextResponse.json({
      ...test,
      hasSubmitted: !!existingResponse,
      previousResponse: existingResponse,
    });
  } catch (error) {
    console.error("Error fetching public test:", error);
    return NextResponse.json(
      { error: "Failed to fetch test" },
      { status: 500 }
    );
  }
}
