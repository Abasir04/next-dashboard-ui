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
    // Auth is optional for public test access; if present and a student, we'll
    // include submission status. Otherwise, serve public test data.
    const user = await getAuthenticatedUser(request).catch(() => null);

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

    // Time-based availability with tolerance for clock skew/timezone differences
    const nowMs = Date.now();
    const TOLERANCE_MS = 15 * 60 * 1000; // 15 minutes

    if (test.startDate) {
      const startMs = new Date(test.startDate).getTime();
      if (!Number.isFinite(startMs)) {
        // If invalid date in DB, don't block access
      } else if (nowMs < startMs - TOLERANCE_MS) {
        return NextResponse.json(
          { error: "Test is not yet available" },
          { status: 400 }
        );
      }
    }

    if (test.dueDate) {
      const dueMs = new Date(test.dueDate).getTime();
      if (Number.isFinite(dueMs) && nowMs > dueMs + TOLERANCE_MS) {
        return NextResponse.json(
          { error: "Test deadline has passed" },
          { status: 400 }
        );
      }
    }

    // If authenticated student, include submission info; otherwise, return public test only
    if (user && user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      // If no student profile, still allow viewing test without submission info
      if (student) {
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
      }
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error("Error fetching public test:", error);
    return NextResponse.json(
      { error: "Failed to fetch test" },
      { status: 500 }
    );
  }
}
