import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { verifyTestToken, extractTokenFromHeader } from "@/lib/verifyTestToken";

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

    // Check if user is lecturer or admin
    if (user.role !== "LECTURER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { lecturerId: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (user.role === "LECTURER" && test.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all responses for this test
    const responses = await prisma.testResponse.findMany({
      where: { testId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            matricNumber: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching test responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch test responses" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = parseInt(params.id);
    if (isNaN(testId)) {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
    }

    // Try standard authentication first
    let user = await getAuthenticatedUser(request);
    let studentId: number | null = null;

    if (user && user.role === "STUDENT") {
      // Standard authentication - get student profile
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

      studentId = student.id;
    } else {
      // Try JWT token authentication
      const authHeader = request.headers.get("authorization");

      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        console.error("No authorization token found in header");
        return NextResponse.json(
          {
            error: "No authorization token provided",
          },
          { status: 401 }
        );
      }

      // Verify the JWT token
      const verification = await verifyTestToken(token);

      if (!verification.valid || !verification.payload) {
        console.error("Token verification failed:", verification.error);
        return NextResponse.json(
          {
            error: verification.error || "Invalid token",
          },
          { status: 401 }
        );
      }

      const { studentId: tokenStudentId, testId: tokenTestId } =
        verification.payload;

      // Ensure the token is for the correct test
      if (parseInt(tokenTestId) !== testId) {
        return NextResponse.json(
          {
            error: "Token does not match test ID",
          },
          { status: 403 }
        );
      }

      studentId = parseInt(tokenStudentId);
    }

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers, timeSpent } = body;

    // Get full test details
    const fullTest = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!fullTest) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (!fullTest.isPublished) {
      return NextResponse.json(
        { error: "Test is not published" },
        { status: 400 }
      );
    }

    // Check if test has due date and is still open
    if (fullTest.dueDate && new Date() > fullTest.dueDate) {
      return NextResponse.json(
        { error: "Test deadline has passed" },
        { status: 400 }
      );
    }

    // Check if student has already submitted
    const existingResponse = await prisma.testResponse.findUnique({
      where: {
        testId_studentId: {
          testId,
          studentId: studentId,
        },
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: "Test already submitted" },
        { status: 400 }
      );
    }

    // Calculate score for objective questions
    let score = 0;
    let totalPoints = 0;

    fullTest.questions.forEach((question) => {
      totalPoints += question.points;

      if (question.type === "MULTIPLE_CHOICE" || question.type === "CHECKBOX") {
        // Only score if correct answers are defined
        if (question.correct && question.correct.length > 0) {
          const correctAnswers = question.correct.sort();
          const studentAnswers = (answers[question.id] || []).sort();

          if (
            JSON.stringify(correctAnswers) === JSON.stringify(studentAnswers)
          ) {
            score += question.points;
          }
        }
        // For questions without correct answers defined, they are not scored (essay questions, etc.)
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    // Create test response
    const response = await prisma.testResponse.create({
      data: {
        testId,
        studentId: studentId,
        answers,
        score: percentage,
        timeSpent: timeSpent ? parseInt(timeSpent) : null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            matricNumber: true,
          },
        },
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error submitting test response:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to submit test response" },
      { status: 500 }
    );
  }
}
