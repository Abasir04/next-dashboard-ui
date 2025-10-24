import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request (you might want to add additional security)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all TestAccess records that should be invalidated
    // (expired due date + 1 minute grace period)
    const expiredAccesses = await prisma.testAccess.findMany({
      where: {
        verified: true,
        expiresAt: {
          lt: now, // expiresAt is before now
        },
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
          },
        },
      },
    });

    // Invalidate all expired test accesses
    const result = await prisma.testAccess.updateMany({
      where: {
        verified: true,
        expiresAt: {
          lt: now,
        },
      },
      data: {
        verified: false,
      },
    });


    return NextResponse.json({
      success: true,
      message: `Invalidated ${result.count} expired test access records`,
      invalidatedCount: result.count,
      expiredAccesses: expiredAccesses.map((access) => ({
        testId: access.test.id,
        testTitle: access.test.title,
        studentId: access.student.id,
        studentName: access.student.name,
        matricNumber: access.student.matricNumber,
        expiredAt: access.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Error invalidating expired test accesses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
