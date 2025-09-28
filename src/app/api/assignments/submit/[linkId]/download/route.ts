import { NextRequest, NextResponse } from "next/server";
import { generateDownloadUrl as generateBackblazeUrl } from "@/lib/backblaze";
import { prisma } from "@/lib/prisma";

// Ensure Node.js runtime
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params;

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    // Get assignment details by linkId
    const assignment = await prisma.assignment.findUnique({
      where: { linkId },
      select: {
        id: true,
        title: true,
        lecturerFileUrl: true,
        lecturerFileName: true,
        isActive: true,
        dueDate: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if assignment is still active and not expired
    const now = new Date();
    const isExpired = now > assignment.dueDate;
    const isActive = assignment.isActive && !isExpired;

    if (!isActive) {
      return NextResponse.json(
        {
          error: "Assignment file is no longer available",
          reason: isExpired
            ? "Assignment has expired"
            : "Assignment is inactive",
        },
        { status: 410 }
      );
    }

    if (!assignment.lecturerFileUrl) {
      return NextResponse.json(
        { error: "No file available for this assignment" },
        { status: 404 }
      );
    }

    // Generate download URL using Backblaze B2
    console.log("Assignment file URL:", assignment.lecturerFileUrl);
    console.log("Original filename:", assignment.lecturerFileName);

    const downloadUrl = await generateBackblazeUrl(
      assignment.lecturerFileUrl,
      assignment.lecturerFileName
    );

    console.log("Generated download URL:", downloadUrl);

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error("Error generating assignment download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}
