import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// GET - Get test details for verification
export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
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

    const startMs = test.startDate
      ? new Date(test.startDate).getTime()
      : undefined;
    const dueMs = test.dueDate ? new Date(test.dueDate).getTime() : undefined;

    if (startMs && Number.isFinite(startMs)) {
      if (nowMs < startMs - TOLERANCE_MS) {
        return NextResponse.json(
          { error: "Test is not yet available" },
          { status: 400 }
        );
      }
    }

    if (dueMs && Number.isFinite(dueMs)) {
      if (nowMs > dueMs + TOLERANCE_MS) {
        return NextResponse.json(
          { error: "Test deadline has passed" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        timeLimit: test.timeLimit,
        startDate: test.startDate,
        dueDate: test.dueDate,
        allowViewScore: test.allowViewScore,
        lecturer: test.lecturer,
        course: test.course,
        level: test.level,
      },
    });
  } catch (error) {
    console.error("Error fetching test for verification:", error);
    return NextResponse.json(
      { error: "Failed to fetch test" },
      { status: 500 }
    );
  }
}

// POST - Authenticate student for test
export async function POST(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const { shareToken } = params;
    const body = await request.json();
    const { matricNumber, password } = body;

    // Validate input
    if (!matricNumber || !password) {
      return NextResponse.json(
        { error: "Matric number and password are required" },
        { status: 400 }
      );
    }

    // Get the test
    const test = await prisma.test.findUnique({
      where: { shareToken },
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

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (!test.isPublished) {
      return NextResponse.json(
        { error: "Test is not published" },
        { status: 400 }
      );
    }

    // Time-based availability check
    const nowMs = Date.now();
    const TOLERANCE_MS = 15 * 60 * 1000; // 15 minutes

    const startMs = test.startDate
      ? new Date(test.startDate).getTime()
      : undefined;
    const dueMs = test.dueDate ? new Date(test.dueDate).getTime() : undefined;

    if (startMs && Number.isFinite(startMs)) {
      if (nowMs < startMs - TOLERANCE_MS) {
        return NextResponse.json(
          { error: "Test is not yet available" },
          { status: 400 }
        );
      }
    }

    if (dueMs && Number.isFinite(dueMs)) {
      if (nowMs > dueMs + TOLERANCE_MS) {
        return NextResponse.json(
          { error: "Test deadline has passed" },
          { status: 400 }
        );
      }
    }

    // Find student by matric number
    const student = await prisma.student.findUnique({
      where: { matricNumber },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      student.user.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if student is registered for the course
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        courseId: test.courseId,
        status: "APPROVED",
        OR: [
          { studentEmail: student.user.email },
          { matricNumber: student.matricNumber },
        ],
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "You are not registered for this course" },
        { status: 403 }
      );
    }

    // Check if student has already submitted the test
    const existingResponse = await prisma.testResponse.findUnique({
      where: {
        testId_studentId: {
          testId: test.id,
          studentId: student.id,
        },
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: "You have already submitted this test" },
        { status: 400 }
      );
    }

    // Create or update TestAccess record with 2-minute grace period after due date
    // This matches the JWT token expiration and verification grace period
    const expiresAtMs = test.dueDate
      ? new Date(test.dueDate).getTime() + 2 * 60 * 1000 // dueDate + 2 minutes
      : Date.now() + 60 * 60 * 1000;
    const expiresAtDate = new Date(expiresAtMs);
    await (prisma as any).testAccess.upsert({
      where: { testId_studentId: { testId: test.id, studentId: student.id } },
      update: {
        expiresAt: expiresAtDate,
        verified: true, // Mark as verified when student completes verification
      },
      create: {
        testId: test.id,
        studentId: student.id,
        verified: true, // Mark as verified when student completes verification
        expiresAt: expiresAtDate,
      },
    });

    // Generate JWT token for test authentication
    const { generateTestToken } = await import("@/lib/verifyTestToken");
    const testToken = generateTestToken(
      student.id.toString(),
      test.id.toString(),
      shareToken,
      new Date(test.dueDate)
    );

    return NextResponse.json({
      success: true,
      message:
        "Authentication successful. You can now proceed to take the test.",
      token: testToken,
      student: {
        id: student.id,
        name: student.name,
        matricNumber: student.matricNumber,
        email: student.user.email,
      },
    });
  } catch (error) {
    console.error("Error authenticating student for test:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
