import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/course-registration/[linkId] - Get registration link details
export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params;

    if (!linkId) {
      return NextResponse.json(
        { error: "Registration link ID is required" },
        { status: 400 }
      );
    }

    const registrationLink = await prisma.courseRegistrationLink.findUnique({
      where: { id: linkId },
      include: {
        course: {
          include: {
            lecturer: true,
          },
        },
        lecturer: true,
      },
    });

    if (!registrationLink) {
      return NextResponse.json(
        { error: "Registration link not found" },
        { status: 404 }
      );
    }

    // Check if link is expired
    if (new Date() > registrationLink.expiresAt || !registrationLink.isActive) {
      return NextResponse.json(
        { error: "Registration link has expired or is inactive" },
        { status: 410 }
      );
    }

    return NextResponse.json(registrationLink);
  } catch (error) {
    console.error("Error fetching registration link:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration link" },
      { status: 500 }
    );
  }
}
