import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper function to upload file to Cloudinary
export const uploadToCloudinary = async (
  file: File,
  folder: string = "course-materials"
): Promise<{ secure_url: string; public_id: string }> => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary credentials are missing. Check environment variables."
      );
    }

    // Determine resource type (video files must use resource_type: "video")
    const isVideo = getFileType(file.name) === "video";

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              type: "authenticated", // Upload as authenticated/private assets
              resource_type: isVideo ? "video" : "image", // Use 'image' for documents to ensure consistency
              public_id: `${Date.now()}-${file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9-_]+/g, "-")}`,
            },
            (error, result) => {
              if (error) reject(error);
              else if (result && result.secure_url) {
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id,
                });
              } else {
                reject(new Error("Upload failed - no result"));
              }
            }
          )
          .end(buffer);
      }
    );

    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    const message =
      typeof error === "object" && error && "message" in (error as any)
        ? (error as any).message
        : String(error);
    throw new Error(`Failed to upload file: ${message}`);
  }
};

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw new Error("Failed to delete file");
  }
};

// Helper function to get file type from URL or filename
export const getFileType = (filename: string): "document" | "video" => {
  const videoExtensions = [
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".mkv",
  ];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));

  return videoExtensions.includes(extension) ? "video" : "document";
};

// Helper function to extract publicId from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    const urlParts = url.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) {
      console.log("No 'upload' found in URL:", url);
      return null;
    }

    // Get the publicId (everything after 'upload/' excluding version)
    const publicIdParts = urlParts.slice(uploadIndex + 2); // Skip 'upload' and version
    const publicId = publicIdParts.join("/");

    // Debug logging
    console.log("Extracted publicId from URL:", publicId);
    console.log("Original URL:", url);

    return publicId;
  } catch (error) {
    console.error("Error extracting publicId from URL:", error);
    return null;
  }
};

// Generate signed download URL for authenticated course materials
export function generateDownloadUrl(
  fileUrl: string,
  originalFilename?: string
): string {
  try {
    // If it's a Cloudinary URL, generate signed URL for authenticated assets
    if (fileUrl.includes("cloudinary.com")) {
      // Extract public ID from the Cloudinary URL
      const publicId = extractPublicIdFromUrl(fileUrl);

      if (!publicId) {
        console.error("Could not extract public ID from URL:", fileUrl);
        return fileUrl; // Fallback to original URL
      }

      // Determine resource type based on file extension
      const isVideo = originalFilename
        ? getFileType(originalFilename) === "video"
        : false;
      const resourceType = isVideo ? "video" : "image";

      // Generate signed URL for authenticated assets
      const timestamp = Math.floor(new Date().getTime() / 1000);
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        console.error("Missing Cloudinary credentials");
        return fileUrl; // Fallback to original URL
      }

      // Create audit context (base64 encoded JSON)
      const auditContext = {
        actor_type: "user",
        actor_id: "580b9563f01b4386e64ec9a18ce57e0f",
        user_external_id: "3afc7085002caccf70a109755c56bb",
        user_custom_id: "adebayoadulbasir@gmail.com",
        component: "console",
      };
      const auditContextB64 = Buffer.from(
        JSON.stringify(auditContext)
      ).toString("base64");

      // Create signature for authenticated access
      // Parameters must be in alphabetical order: api_key, attachment, audit_context, public_id, source, target_filename, timestamp, type
      const stringToSign = `api_key=${apiKey}&attachment=true&audit_context=${auditContextB64}&public_id=${publicId}&source=ml&target_filename=${encodeURIComponent(
        originalFilename || publicId
      )}&timestamp=${timestamp}&type=authenticated${apiSecret}`;
      const crypto = require("crypto");
      const signature = crypto
        .createHash("sha1")
        .update(stringToSign)
        .digest("hex");

      // Generate signed download URL using the exact format from the working URL
      const downloadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/download?api_key=${apiKey}&attachment=true&audit_context=${auditContextB64}&public_id=${encodeURIComponent(
        publicId
      )}&signature=${signature}&source=ml&target_filename=${encodeURIComponent(
        originalFilename || publicId
      )}&timestamp=${timestamp}&type=authenticated`;

      console.log(
        "Generated signed download URL for authenticated asset:",
        downloadUrl
      );
      return downloadUrl;
    }

    // For non-Cloudinary URLs (e.g., S3), return as-is
    console.log("Non-Cloudinary URL, returning as-is:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    // Fallback to original URL
    return fileUrl;
  }
}
