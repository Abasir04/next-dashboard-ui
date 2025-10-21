import { NextRequest, NextResponse } from "next/server";
import { verifyTestToken, extractTokenFromHeader } from "@/lib/verifyTestToken";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = parseInt(params.id);
    if (isNaN(testId)) {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
    }

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    // Verify the JWT token
    const verification = await verifyTestToken(token);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        {
          error: verification.error || "Invalid token",
        },
        { status: 401 }
      );
    }

    const { studentId, testId: tokenTestId } = verification.payload;

    // Ensure the token is for the correct test
    if (parseInt(tokenTestId) !== testId) {
      return NextResponse.json(
        {
          error: "Token does not match test ID",
        },
        { status: 403 }
      );
    }

    // Verify the test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, title: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Update TestAccess to mark as not verified (effectively invalidating the session)
    await prisma.testAccess.updateMany({
      where: {
        testId: testId,
        studentId: parseInt(studentId),
      },
      data: {
        verified: false,
      },
    });

    // Note: In a production environment, you would also want to:
    // 1. Add the token's jti to a blacklist table/cache
    // 2. Implement token blacklisting in verifyTestToken
    // For now, we rely on the DB verification status

    return NextResponse.json({
      success: true,
      message: "Test session cancelled successfully",
      testTitle: test.title,
    });
  } catch (error) {
    console.error("Error cancelling test session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
