/**
 * Content Type Utilities
 * Unified content type mappings for file serving
 */

/**
 * Get MIME content type from file extension
 */
export function getContentTypeFromExtension(
  filename: string,
  defaultType = "application/octet-stream",
): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  // Model formats
  if (ext === "glb") return "model/gltf-binary";
  if (ext === "gltf") return "model/gltf+json";
  if (ext === "vrm") return "model/vrm";
  
  // Image formats
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  
  // Audio formats
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "wav") return "audio/wav";
  if (ext === "ogg") return "audio/ogg";
  if (ext === "m4a") return "audio/mp4";
  
  // Video formats
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  
  // Text formats
  if (ext === "json") return "application/json";
  if (ext === "txt") return "text/plain";
  if (ext === "md") return "text/markdown";
  
  return defaultType;
}

/**
 * Get content type for model format
 */
export function getModelContentType(
  format: "glb" | "vrm" | "gltf",
): string {
  switch (format) {
    case "vrm":
      return "application/octet-stream";
    case "gltf":
      return "model/gltf+json";
    case "glb":
    default:
      return "model/gltf-binary";
  }
}

/**
 * Valid MIME types for image uploads
 */
export const VALID_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

/**
 * Check if a MIME type is a valid image type
 */
export function isValidImageMimeType(mimeType: string): boolean {
  return VALID_IMAGE_MIME_TYPES.includes(mimeType as typeof VALID_IMAGE_MIME_TYPES[number]);
}

/**
 * Get file extension from content type
 */
export function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("mp3")) return "mp3";
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("glb")) return "glb";
  if (contentType.includes("gltf")) return "gltf";
  if (contentType.includes("vrm")) return "vrm";
  if (contentType.includes("json")) return "json";
  return "png"; // Default to png
}

/**
 * Default content types for common file types
 */
export const DEFAULT_CONTENT_TYPES = {
  image: "image/png",
  audio: "audio/mpeg",
  model: "model/gltf-binary",
  json: "application/json",
} as const;
