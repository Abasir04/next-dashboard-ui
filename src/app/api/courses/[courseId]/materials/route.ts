import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { uploadBufferToS3, sanitizeKeyPart } from "@/lib/s3";

// Ensure Node.js runtime for Buffer and streaming APIs
export const runtime = "nodejs";
// Allow longer processing time for larger uploads
export const maxDuration = 60;

// GET - Fetch all materials for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = parseInt(params.courseId);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    // Check if user has access to this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(user.role === "LECTURER"
          ? {
              lecturer: {
                userId: user.id,
              },
            }
          : {}),
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch materials for the course
    const materials = await prisma.courseMaterial.findMany({
      where: { courseId },
      include: {
        lecturer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Error fetching course materials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Upload new material
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = parseInt(params.courseId);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    // Check if user has access to this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(user.role === "LECTURER"
          ? {
              lecturer: {
                userId: user.id,
              },
            }
          : {}),
      },
      include: {
        lecturer: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size per type
    const lowerName = file.name.toLowerCase();
    const isVideo =
      lowerName.includes(".mp4") ||
      lowerName.includes(".avi") ||
      lowerName.includes(".mov") ||
      lowerName.includes(".wmv") ||
      lowerName.includes(".flv") ||
      lowerName.includes(".webm") ||
      lowerName.includes(".mkv");

    const maxDocSize = 50 * 1024 * 1024; // 50MB via S3/Backblaze
    const maxVideoSize = 100 * 1024 * 1024; // 100MB via S3/Backblaze

    if (
      (!isVideo && file.size > maxDocSize) ||
      (isVideo && file.size > maxVideoSize)
    ) {
      return NextResponse.json(
        {
          error: isVideo
            ? "Video size too large. Maximum is 100MB."
            : "Document size too large. Maximum is 10MB.",
        },
        { status: 400 }
      );
    }

    // Decide storage: videos and documents >10MB -> S3; small documents -> Cloudinary
    const useS3 = isVideo || file.size > 10 * 1024 * 1024;

    let fileUrl = "";
    let storagePublicId: string | null = null;

    if (useS3) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = sanitizeKeyPart(file.name.replace(/\.[^/.]+$/, ""));
      const key = `course-materials/${courseId}/${Date.now()}-${safeName}`;
      const result = await uploadBufferToS3({
        buffer,
        key,
        contentType: file.type || undefined,
      });
      fileUrl = result.url;
    } else {
      // Upload to Cloudinary for small documents
      const uploadResult = await uploadToCloudinary(
        file,
        `course-materials/${courseId}`
      );
      if (!uploadResult || !uploadResult.secure_url) {
        return NextResponse.json(
          { error: "Failed to upload file" },
          { status: 500 }
        );
      }
      fileUrl = uploadResult.secure_url;
      storagePublicId = uploadResult.public_id;
    }

    // Determine file type
    const fileType = isVideo ? "video" : "document";

    // Save to database
    const material = await prisma.courseMaterial.create({
      data: {
        courseId,
        fileUrl,
        fileType,
        originalFilename: file.name,
        uploadedBy: course.lecturer.id,
      },
      include: {
        lecturer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error("Error uploading course material:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
