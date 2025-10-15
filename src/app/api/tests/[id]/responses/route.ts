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
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is student
    if (user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const testId = parseInt(params.id);
    if (isNaN(testId)) {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
    }

    const body = await request.json();
    const { answers, timeSpent } = body;

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

    // Check if test exists and is published
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
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

    // Check if test has due date and is still open
    if (test.dueDate && new Date() > test.dueDate) {
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
          studentId: student.id,
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

    test.questions.forEach((question) => {
      totalPoints += question.points;

      if (question.type === "MULTIPLE_CHOICE" || question.type === "CHECKBOX") {
        const correctAnswers = question.correct.sort();
        const studentAnswers = (answers[question.id] || []).sort();

        if (JSON.stringify(correctAnswers) === JSON.stringify(studentAnswers)) {
          score += question.points;
        }
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    // Create test response
    const response = await prisma.testResponse.create({
      data: {
        testId,
        studentId: student.id,
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
    return NextResponse.json(
      { error: "Failed to submit test response" },
      { status: 500 }
    );
  }
}
