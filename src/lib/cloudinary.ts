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
              resource_type: isVideo ? "video" : "auto",
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
