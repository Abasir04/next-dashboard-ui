import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { deleteFile as deleteFromBackblaze } from "@/lib/backblaze";

// DELETE - Delete a material
export async function DELETE(
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
        { error: "Invalid course or material ID" },
        { status: 400 }
      );
    }

    // Check if user has access to this course and material
    const material = await prisma.courseMaterial.findFirst({
      where: {
        id: materialId,
        courseId,
        ...(user.role === "LECTURER"
          ? {
              lecturer: {
                userId: user.id,
              },
            }
          : {}),
      },
      include: {
        course: true,
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found or access denied" },
        { status: 404 }
      );
    }

    // Delete from Backblaze B2 storage
    try {
      await deleteFromBackblaze(material.fileUrl);
    } catch (storageError) {
      console.error("Error deleting from Backblaze B2:", storageError);
      // Continue with database deletion even if storage deletion fails
      // This prevents orphaned database records
    }

    // Delete from database
    await prisma.courseMaterial.delete({
      where: { id: materialId },
    });

    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting course material:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
