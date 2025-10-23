import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

export interface TestTokenPayload {
  studentId: string;
  testId: string;
  shareToken: string;
  exp: number;
  iat: number;
  jti: string; // Unique token ID for blacklisting
}

export interface VerificationResult {
  valid: boolean;
  payload?: TestTokenPayload;
  error?: string;
}

/**
 * Verifies a test JWT token and validates against database
 */
export async function verifyTestToken(
  token: string
): Promise<VerificationResult> {
  try {
    // Verify JWT signature and decode
    const payload = jwt.verify(
      token,
      process.env.TEST_JWT_SECRET!
    ) as TestTokenPayload;

    // Check if token is expired
    if (Date.now() >= payload.exp * 1000) {
      return {
        valid: false,
        error: "Token expired",
      };
    }

    // Get test details to validate expiration
    const test = await prisma.test.findUnique({
      where: { id: parseInt(payload.testId) },
      select: {
        id: true,
        dueDate: true,
        isPublished: true,
        shareToken: true,
      },
    });

    if (!test) {
      return {
        valid: false,
        error: "Test not found",
      };
    }

    // Verify shareToken matches
    if (test.shareToken !== payload.shareToken) {
      return {
        valid: false,
        error: "Invalid test token",
      };
    }

    // Check if test is still published
    if (!test.isPublished) {
      return {
        valid: false,
        error: "Test is no longer published",
      };
    }

    // Check if test is still open (due date + 2 minute grace period)
    // This matches the token expiration time to allow students to submit
    const dueDateWithGrace = new Date(test.dueDate);
    dueDateWithGrace.setMinutes(dueDateWithGrace.getMinutes() + 2);

    if (new Date() > dueDateWithGrace) {
      return {
        valid: false,
        error: "Test deadline has passed",
      };
    }

    // Verify student is still registered and verified for this test
    const testAccess = await prisma.testAccess.findUnique({
      where: {
        testId_studentId: {
          testId: parseInt(payload.testId),
          studentId: parseInt(payload.studentId),
        },
      },
      select: { verified: true, expiresAt: true },
    });

    if (!testAccess || !testAccess.verified) {
      return {
        valid: false,
        error: "Student not verified for this test",
      };
    }

    // Check if TestAccess has expired
    if (testAccess.expiresAt.getTime() < Date.now()) {
      return {
        valid: false,
        error: "Test access has expired",
      };
    }

    // Check if token is blacklisted (optional - can be implemented with Redis or DB)
    // For now, we'll skip this check as it requires additional infrastructure

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return {
      valid: false,
      error: "Invalid token",
    };
  }
}

/**
 * Generates a test JWT token for a verified student
 */
export function generateTestToken(
  studentId: string,
  testId: string,
  shareToken: string,
  dueDate: Date
): string {
  const payload: Omit<TestTokenPayload, "iat" | "jti" | "exp"> = {
    studentId,
    testId,
    shareToken,
  };

  // Token should be valid until dueDate + 2 minutes grace period
  // This gives students enough time to submit even if they start right at the deadline
  const expirationTime = Math.floor(
    (dueDate.getTime() + 2 * 60000 - Date.now()) / 1000
  );

  return jwt.sign(payload, process.env.TEST_JWT_SECRET!, {
    algorithm: "HS256",
    expiresIn: Math.max(expirationTime, 120), // Minimum 2 minutes validity
    jwtid: `test_${testId}_${studentId}_${Date.now()}`, // Unique token ID
  });
}

/**
 * Extracts token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
