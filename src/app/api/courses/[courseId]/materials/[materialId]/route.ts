import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

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
        ...(user.role === "lecturer"
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

    // Extract public ID from Cloudinary URL
    const urlParts = material.fileUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(publicId);
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
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
