import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { parseS3KeyFromUrl, deleteFromS3ByKey } from "@/lib/s3";

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

    // Try S3 deletion first; if not S3, try Cloudinary
    const maybeKey = parseS3KeyFromUrl(material.fileUrl);
    if (maybeKey) {
      try {
        await deleteFromS3ByKey(maybeKey);
      } catch (s3Error) {
        console.error("Error deleting from S3:", s3Error);
      }
    } else {
      try {
        const urlParts = material.fileUrl.split("/");
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split(".")[0];
        await deleteFromCloudinary(publicId);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
      }
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
