import { NextRequest, NextResponse } from "next/server";
import { generateDownloadUrl as generateBackblazeUrl } from "@/lib/backblaze";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";

// Ensure Node.js runtime
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; materialId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = parseInt(params.courseId);
    const materialId = parseInt(params.materialId);

    if (isNaN(courseId) || isNaN(materialId)) {
      return NextResponse.json(
        { error: "Invalid course ID or material ID" },
        { status: 400 }
      );
    }

    // Find the material and verify access
    const material = await prisma.courseMaterial.findFirst({
      where: {
        id: materialId,
        courseId: courseId,
      },
      include: {
        course: {
          include: {
            lecturer: true,
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this course
    const hasAccess =
      user.role === "ADMIN" ||
      (user.role === "LECTURER" && material.course.lecturer.userId === user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate download URL using Backblaze B2
    console.log("Material file URL:", material.fileUrl);
    console.log("Original filename:", material.originalFilename);

    const downloadUrl = await generateBackblazeUrl(
      material.fileUrl,
      material.originalFilename
    );

    console.log("Generated download URL:", downloadUrl);

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}
