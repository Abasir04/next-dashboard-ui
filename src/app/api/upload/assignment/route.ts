import { NextRequest, NextResponse } from "next/server";
import { uploadBufferToS3, sanitizeKeyPart } from "@/lib/s3";

// Ensure Node.js runtime for Buffer and streaming APIs
export const runtime = "nodejs";
// Allow longer processing time for larger uploads
export const maxDuration = 60;

// POST - Upload assignment file (for lecturer files)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Upload to Backblaze B2 with assignment-files key format
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = sanitizeKeyPart(file.name.replace(/\.[^/.]+$/, ""));
    const key = `assignment-files/${Date.now()}-${safeName}`;

    const result = await uploadBufferToS3({
      buffer,
      key,
      contentType: file.type || undefined,
    });

    return NextResponse.json({ url: result.url }, { status: 201 });
  } catch (error) {
    console.error("Error uploading assignment file:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
