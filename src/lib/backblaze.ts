import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client for Backblaze B2
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT, // e.g. https://s3.eu-central-003.backblazeb2.com
  region: process.env.S3_REGION || "us-west-2",
  forcePathStyle: true, // Required for Backblaze B2
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

/**
 * Generate a presigned download URL for Backblaze B2 private files
 * @param key - The S3 key (file path) in the bucket
 * @param expiresIn - Expiration time in seconds (default: 5 minutes)
 * @returns Promise<string> - The presigned download URL
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 60 * 5, // 5 minutes
  filename?: string
): Promise<string> {
  try {
    console.log("Generating presigned URL for key:", key);
    console.log("Using bucket:", process.env.S3_BUCKET);

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ResponseContentDisposition: filename
        ? `attachment; filename="${filename}"`
        : "attachment", // Force download instead of display
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    console.log("Generated presigned URL:", signedUrl);
    return signedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate download URL");
  }
}

/**
 * Extract the S3 key from a Backblaze B2 URL
 * @param url - The full Backblaze B2 URL
 * @returns string | null - The S3 key or null if not a valid B2 URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    // Backblaze B2 URLs look like: https://s3.eu-central-003.backblazeb2.com/bucket-name/path/to/file.pdf
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname
      .split("/")
      .filter((part) => part.length > 0);

    // Debug logging
    console.log("URL pathname:", urlObj.pathname);
    console.log("Path parts:", pathParts);
    console.log("Expected bucket:", process.env.S3_BUCKET);

    // Remove the bucket name (first part) to get the key
    if (pathParts.length > 1) {
      const bucketName = process.env.S3_BUCKET;
      let keyParts = pathParts.slice(1);

      // Check if it's a Backblaze B2 native URL format (f003.backblazeb2.com/file/bucket/key)
      if (pathParts[0] === "file" && pathParts.length > 2) {
        // Native B2 format: /file/bucket/key
        keyParts = pathParts.slice(2); // Skip "file" and bucket name
        console.log(
          "Backblaze B2 native URL format detected, extracted key:",
          keyParts.join("/")
        );
        return keyParts.join("/");
      }

      // Check for double bucket name (e.g., Lecturer-Dashboard/Lecturer-Dashboard/...)
      if (
        bucketName &&
        pathParts.length > 2 &&
        pathParts[0] === bucketName &&
        pathParts[1] === bucketName
      ) {
        // Double bucket name detected, remove both
        keyParts = pathParts.slice(2);
        console.log(
          "Double bucket name detected, extracted key:",
          keyParts.join("/")
        );
        return keyParts.join("/");
      }

      // If the first part matches the bucket name, remove it
      if (bucketName && pathParts[0] === bucketName) {
        console.log("Extracted key:", keyParts.join("/"));
        return keyParts.join("/");
      } else {
        // If bucket name doesn't match or isn't set, assume the first part is the bucket
        console.log(
          "Bucket name mismatch, using all parts after first as key:",
          keyParts.join("/")
        );
        return keyParts.join("/");
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting S3 key from URL:", error);
    return null;
  }
}

/**
 * Check if a URL is a Backblaze B2 URL
 * @param url - The URL to check
 * @returns boolean - True if it's a Backblaze B2 URL
 */
export function isBackblazeUrl(url: string): boolean {
  return (
    url.includes("backblazeb2.com") ||
    (!!process.env.S3_ENDPOINT && url.includes(process.env.S3_ENDPOINT))
  );
}

/**
 * Generate download URL for any storage provider
 * @param fileUrl - The file URL
 * @param originalFilename - The original filename
 * @returns Promise<string> - The download URL
 */
export async function generateDownloadUrl(
  fileUrl: string,
  originalFilename?: string
): Promise<string> {
  try {
    // Check if it's a Backblaze B2 URL
    if (isBackblazeUrl(fileUrl)) {
      const key = extractS3KeyFromUrl(fileUrl);
      if (!key) {
        console.error("Could not extract S3 key from Backblaze URL:", fileUrl);
        return fileUrl; // Fallback to original URL
      }

      return await getPresignedDownloadUrl(key, 60 * 5, originalFilename);
    }

    // For non-Backblaze URLs, return as-is
    console.log("Non-Backblaze URL, returning as-is:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    // Fallback to original URL
    return fileUrl;
  }
}
