import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint is intended to be triggered by a scheduler (e.g., Vercel Cron)
// It deactivates all course registration links that have expired

async function handler(request: NextRequest) {
  try {
    // Optional simple auth using a static header secret to prevent abuse
    const requiredKey = process.env.CRON_SECRET;
    if (requiredKey) {
      const providedKey = request.headers.get("x-cron-key");
      if (providedKey !== requiredKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();

    // Deactivate all active links that are past their expiry
    const result = await prisma.courseRegistrationLink.updateMany({
      where: {
        isActive: true,
        expiresAt: { lte: now },
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      message: "Expired registration links deactivated",
      deactivatedCount: result.count,
      runAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron deactivate-expired-links error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate expired links" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
