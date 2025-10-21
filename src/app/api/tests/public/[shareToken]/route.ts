import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { verifyTestToken, extractTokenFromHeader } from "@/lib/verifyTestToken";
import crypto from "crypto";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const url = new URL(request.url);
    const debug = url.searchParams.get("debug") === "1";
    // Allow access EITHER via app auth OR via per-test auth cookie
    const { shareToken } = params;

    let studentIdFromCookie: number | null = null;
    const cookieName = `test_auth_${shareToken}`;
    const cookie = request.cookies.get(cookieName)?.value;
    if (cookie) {
      try {
        const secret =
          process.env.AUTH_COOKIE_SECRET ||
          process.env.NEXTAUTH_SECRET ||
          "dev-secret-change";
        const [b64, sig] = cookie.split(".");
        const payloadStr = Buffer.from(b64, "base64").toString("utf8");
        const expectedSig = crypto
          .createHmac("sha256", secret)
          .update(payloadStr)
          .digest("hex");
        if (sig === expectedSig) {
          const [studentIdStr, tokenInCookie, expiresAtStr] =
            payloadStr.split(":");
          const expiresAt = Number(expiresAtStr);
          if (
            tokenInCookie === shareToken &&
            Number.isFinite(expiresAt) &&
            Date.now() <= expiresAt
          ) {
            studentIdFromCookie = Number(studentIdStr);
          }
        }
      } catch {}
    }

    // If no valid cookie, try JWT token authentication, then fall back to app auth
    let user = await getAuthenticatedUser(request);
    let jwtStudentId: number | null = null;

    if (!studentIdFromCookie) {
      // Try JWT token authentication first
      const authHeader = request.headers.get("Authorization");
      const token = extractTokenFromHeader(authHeader);

      if (token) {
        try {
          const verification = await verifyTestToken(token);
          if (verification.valid && verification.payload) {
            // Verify the token's shareToken matches the request shareToken
            if (verification.payload.shareToken === shareToken) {
              jwtStudentId = Number(verification.payload.studentId);
            }
          }
        } catch (error) {
          console.error("JWT verification failed:", error);
        }
      }

      // If JWT auth failed, require standard app auth
      if (!jwtStudentId) {
        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "STUDENT") {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

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

    const startMs = test.startDate
      ? new Date(test.startDate).getTime()
      : undefined;
    const dueMs = test.dueDate ? new Date(test.dueDate).getTime() : undefined;

    if (debug) {
      console.log(
        "[PublicTestDebug] nowMs:",
        nowMs,
        "startMs:",
        startMs,
        "dueMs:",
        dueMs,
        "tolerance:",
        TOLERANCE_MS
      );
    }

    if (startMs && Number.isFinite(startMs)) {
      if (nowMs < startMs - TOLERANCE_MS) {
        const payload: any = { error: "Test is not yet available" };
        if (debug)
          payload.debug = { nowMs, startMs, dueMs, toleranceMs: TOLERANCE_MS };
        return NextResponse.json(payload, { status: 400 });
      }
    }

    if (dueMs && Number.isFinite(dueMs)) {
      if (nowMs > dueMs + TOLERANCE_MS) {
        const payload: any = { error: "Test deadline has passed" };
        if (debug)
          payload.debug = { nowMs, startMs, dueMs, toleranceMs: TOLERANCE_MS };
        return NextResponse.json(payload, { status: 400 });
      }
    }

    // Resolve student either via cookie student id, JWT student id, or via logged-in user
    const student = studentIdFromCookie
      ? await prisma.student.findUnique({
          where: { id: studentIdFromCookie },
          select: { id: true, email: true, matricNumber: true },
        })
      : jwtStudentId
      ? await prisma.student.findUnique({
          where: { id: jwtStudentId },
          select: { id: true, email: true, matricNumber: true },
        })
      : await prisma.student.findUnique({
          where: { userId: user!.id },
          select: { id: true, email: true, matricNumber: true },
        });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Check registration for this course (APPROVED)
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        courseId: test.course.id,
        status: "APPROVED",
        OR: [
          { studentEmail: student.email },
          { matricNumber: student.matricNumber },
        ],
      },
      select: { id: true },
    });
    // Enforce TestAccess if authenticating via cookie or JWT (no app user session)
    if (studentIdFromCookie || jwtStudentId) {
      const access = await (prisma as any).testAccess.findUnique({
        where: { testId_studentId: { testId: test.id, studentId: student.id } },
        select: { expiresAt: true, verified: true },
      });
      if (
        !access ||
        Date.now() > new Date(access.expiresAt).getTime() ||
        !access.verified
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (!registration) {
      return NextResponse.json(
        { error: "You are not registered for this course" },
        { status: 403 }
      );
    }

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
      ...(debug
        ? { debug: { nowMs, startMs, dueMs, toleranceMs: TOLERANCE_MS } }
        : {}),
    });
  } catch (error) {
    console.error("Error fetching public test:", error);
    return NextResponse.json(
      { error: "Failed to fetch test" },
      { status: 500 }
    );
  }
}
