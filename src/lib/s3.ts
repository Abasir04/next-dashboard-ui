import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || ""; // e.g. https://your-cdn-or-endpoint/bucket

if (!S3_BUCKET) {
  console.warn("S3_BUCKET env var is not set. S3 uploads will fail.");
}

export const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT || undefined,
  forcePathStyle: !!S3_ENDPOINT, // needed for many S3-compatible providers
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

export async function uploadBufferToS3(params: {
  buffer: Buffer;
  key: string;
  contentType?: string;
}): Promise<{ url: string; key: string }> {
  const { buffer, key, contentType } = params;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
  } as any);

  try {
    await s3Client.send(command);
  } catch (err) {
    // Retry without ACL for providers that disallow it
    try {
      const cmdNoAcl = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      } as any);
      await s3Client.send(cmdNoAcl);
    } catch (error) {
      console.error("S3 upload failed:", error);
      throw new Error("Failed to upload to S3/Backblaze");
    }
  }

  // Prefer explicit public base URL if provided
  if (S3_PUBLIC_BASE_URL) {
    const base = S3_PUBLIC_BASE_URL.replace(/\/$/, "");
    return { url: `${base}/${key}`, key };
  }

  // Construct generic URL (may not work with all providers without public policy)
  const endpoint = (S3_ENDPOINT || "").replace(/\/$/, "");
  if (endpoint) {
    return { url: `${endpoint}/${S3_BUCKET}/${key}`, key };
  }
  return {
    url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`,
    key,
  };
}

export function sanitizeKeyPart(input: string): string {
  return input.replace(/[^a-zA-Z0-9-_.\/]/g, "-");
}
