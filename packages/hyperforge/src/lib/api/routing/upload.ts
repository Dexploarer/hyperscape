/**
 * Upload API Router
 * 
 * Handles file upload operations
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createGetRoute,
} from "./base";
import {
  ValidationError,
  StorageError,
  withErrorHandling,
} from "@/lib/api";
import type { RouteHandler } from "./types";

/**
 * Upload image
 */
export async function uploadImage(request: NextRequest): Promise<NextResponse> {
  const { storageService } = await import("@/lib/storage");
  const path = await import("path");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "reference";

  if (!file) {
    throw new ValidationError("No file provided", { field: "file" });
  }

  const { isValidImageMimeType } = await import("@/lib/utils");
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  if (!isValidImageMimeType(file.type)) {
    throw new ValidationError(
      "Invalid file type. Only PNG, JPG, and WEBP are allowed.",
      { field: "file", context: { receivedType: file.type } },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File too large. Maximum size is 10MB.", {
      field: "file",
      context: { size: file.size, maxSize: MAX_FILE_SIZE },
    });
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload using unified storage service (automatic Supabase → Local fallback)
  const uploadResult = await storageService.uploadImage(buffer, {
    type: "reference",
    filename: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
    contentType: file.type,
    metadata: {
      uploadType: type,
      originalName: file.name,
    },
  });

  if (!uploadResult.success) {
    throw new StorageError(uploadResult.error || "Failed to upload image", {
      operation: "write",
      storageType: uploadResult.backend,
      context: { filename: file.name },
    });
  }

  return NextResponse.json({
    success: true,
    filename: path.basename(uploadResult.path),
    url: uploadResult.url,
    size: file.size,
    type: file.type,
    storage: uploadResult.backend,
  });
}

/**
 * Serve uploaded image using unified storage (Supabase → Local fallback)
 */
export async function serveImage(
  filename: string,
): Promise<NextResponse> {
  const { storageService } = await import("@/lib/storage");
  const path = await import("path");

  const sanitizedFilename = path.basename(filename);
  
  // Try to download from unified storage
  // Uploaded images are stored in uploads/ folder
  const buffer = await storageService.downloadFile(
    ["uploads", sanitizedFilename],
  );

  if (!buffer) {
    throw new StorageError("File not found", {
      operation: "read",
      storageType: "unified",
      context: { filename: sanitizedFilename },
    });
  }

  // Create file response with proper headers
  const { createFileResponse } = await import("@/lib/utils");
  return createFileResponse(buffer, sanitizedFilename);
}

/**
 * Upload API routes
 */
export const uploadRoutes = {
  POST: {
    image: withErrorHandling(uploadImage) as RouteHandler,
  },
  GET: {
    image: (filename: string) => createGetRoute(async () => serveImage(filename)),
  },
};
