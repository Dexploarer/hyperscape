/**
 * Images API Router
 * 
 * Handles image-related operations:
 * - Listing images from CDN, Supabase, and local storage
 * - Generating images (concept art, sprites, textures)
 * - Serving image files
 * - Getting/deleting image metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import {
  listImageAssets,
  isSupabaseConfigured,
} from "@/lib/storage/supabase-storage";
import { storageService } from "@/lib/storage";
import { loadCDNAssets } from "@/lib/cdn/loader";
import { toKebabCase } from "@/lib/utils/asset-naming";
import { invalidateRegistryCache } from "@/lib/assets/registry";
import { logger } from "@/lib/utils";
import { createGetRoute, createPostRoute, createDeleteRoute } from "./base";
import type { ImageMetadata } from "@/lib/api/schemas/images";
import {
  ValidationError,
  StorageError,
  AuthError,
  GenerationError,
} from "@/lib/api";
import { ImageGenerateSchema } from "@/lib/api/schemas/images";
import type { ValidatedHandler } from "./types";

const log = logger.child("API:Images");

/**
 * List all images from CDN, Supabase, and local storage
 */
async function listImages(): Promise<NextResponse> {
  const images: ImageMetadata[] = [];
  const loadedIds = new Set<string>();
  const cdnUrl =
    process.env.CDN_URL ||
    process.env.NEXT_PUBLIC_CDN_URL ||
    "http://localhost:8080";

  // 1. Load icons/thumbnails from CDN manifests
  try {
    const cdnAssets = await loadCDNAssets();
    for (const asset of cdnAssets) {
      if (asset.iconPath || asset.thumbnailPath) {
        const imagePath = asset.iconPath || asset.thumbnailPath;
        if (!imagePath) continue;

        const imageUrl = imagePath.startsWith("asset://")
          ? imagePath.replace("asset://", `${cdnUrl}/`)
          : `${cdnUrl}/${imagePath}`;

        const id = `cdn_${asset.id}`;
        loadedIds.add(id);

        images.push({
          id,
          filename: path.basename(imagePath),
          url: imageUrl,
          thumbnailUrl: imageUrl,
          type: "icon",
          source: "CDN",
          createdAt: new Date().toISOString(),
        });
      }
    }
    log.info(`Loaded ${images.length} icons from CDN`);
  } catch (error) {
    log.warn({ error }, "Failed to load from CDN");
  }

  // 2. Load from Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabaseImages = await listImageAssets();
      for (const img of supabaseImages) {
        if (loadedIds.has(img.id)) continue;
        loadedIds.add(img.id);
        images.push({
          id: img.id,
          filename: img.filename,
          url: img.url,
          thumbnailUrl: img.url,
          type: img.type,
          source: "FORGE",
          createdAt: img.createdAt || new Date().toISOString(),
          size: img.size,
        });
      }
      log.info(`Loaded ${supabaseImages.length} images from Supabase`);
    } catch (error) {
      log.warn({ error }, "Failed to load from Supabase");
    }
  }

  // 3. Load from local filesystem
  const { getImagesDir, getUploadsDir } = await import("@/lib/utils");
  const imagesDir = getImagesDir();
  const localApiUrl =
    process.env.CDN_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3500";

  try {
    await fs.access(imagesDir);
    const types = ["concept-art", "sprite", "texture", "icon", "other"];

    for (const type of types) {
      const typeDir = path.join(imagesDir, type);
      try {
        await fs.access(typeDir);
        const files = await fs.readdir(typeDir);

        for (const filename of files) {
          if (!filename.match(/\.(png|jpg|jpeg|webp)$/i)) continue;

          const id = filename.replace(/\.[^.]+$/, "");
          if (loadedIds.has(id)) continue;

          const filepath = path.join(typeDir, filename);
          const stats = await fs.stat(filepath);

          images.push({
            id,
            filename,
            url: `${localApiUrl}/api/images/file/${type}/${filename}`,
            thumbnailUrl: `${localApiUrl}/api/images/file/${type}/${filename}`,
            type,
            source: "LOCAL",
            createdAt: stats.mtime.toISOString(),
            size: stats.size,
          });
        }
      } catch {
        // Type directory doesn't exist
      }
    }
  } catch {
    // Images directory doesn't exist
  }

  // Also check uploads directory
  const uploadsDir = getUploadsDir();
  try {
    await fs.access(uploadsDir);
    const files = await fs.readdir(uploadsDir);

    for (const filename of files) {
      if (!filename.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
      if (filename.startsWith("concept_")) {
        const id = filename.replace(/\.[^.]+$/, "");
        if (loadedIds.has(id)) continue;

        const filepath = path.join(uploadsDir, filename);
        const stats = await fs.stat(filepath);

        images.push({
          id,
          filename,
          url: `${localApiUrl}/api/upload/image/${filename}`,
          thumbnailUrl: `${localApiUrl}/api/upload/image/${filename}`,
          type: "concept-art",
          source: "LOCAL",
          createdAt: stats.mtime.toISOString(),
          size: stats.size,
        });
      }
    }
  } catch {
    // Uploads directory doesn't exist
  }

  // Sort by creation date, newest first
  images.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json({ images });
}

/**
 * Generate an image using AI
 */
async function generateImage(
  _request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof ImageGenerateSchema.parse>,
): Promise<NextResponse> {
  const { type, prompt, options } = body;

  if (!prompt?.trim()) {
    throw new ValidationError("Prompt is required");
  }

  log.info({ type, prompt: prompt.substring(0, 100) }, "Generating image");

  // Build prompt (simplified - full prompt building logic should be extracted)
  const fullPrompt = `Create a ${type} image: "${prompt}"`;

  // Generate using Vercel AI Gateway
  const result = await generateText({
    model: gateway("google/gemini-2.5-flash-image"),
    prompt: fullPrompt,
  });

  const imageFiles = result.files?.filter((f) =>
    f.mediaType?.startsWith("image/"),
  );

  if (!imageFiles || imageFiles.length === 0) {
    throw new GenerationError("Failed to generate image - no image in response");
  }

  const file = imageFiles[0];
  const buffer = Buffer.from(file.uint8Array);
  const mediaType = file.mediaType || "image/png";

  const promptSlug = toKebabCase(prompt.substring(0, 30));
  const timestamp = Date.now().toString(36).slice(-4);
  const id = `${promptSlug}-${timestamp}`;
  const extension = mediaType.includes("png") ? "png" : "jpg";
  const filename = `${id}.${extension}`;

  // Upload using unified storage service (automatic Supabase → Local fallback)
  const imageType =
    type === "sprite" ? "sprite" : type === "texture" ? "texture" : "concept-art";

  const uploadResult = await storageService.uploadImage(buffer, {
    type: imageType,
    filename: id,
    contentType: mediaType,
    prompt,
    style: options?.style,
    metadata: {},
  });

  let imageUrl: string;
  if (uploadResult.success) {
    imageUrl = uploadResult.url;
    invalidateRegistryCache();
    log.info({ imageUrl, type: imageType, backend: uploadResult.backend }, "Image uploaded");
  } else {
    // If upload failed completely, fall back to base64 data URI
    imageUrl = `data:${mediaType};base64,${buffer.toString("base64")}`;
    log.warn({ error: uploadResult.error }, "Image upload failed, using base64");
  }

  return NextResponse.json({
    success: true,
    image: {
      id,
      filename,
      url: imageUrl,
      thumbnailUrl: imageUrl,
      type,
      prompt,
      mediaType,
      createdAt: new Date().toISOString(),
    },
  });
}

/**
 * Get image metadata by ID
 */
function getImageById(id: string): Promise<NextResponse> {
  return Promise.resolve(
    (async () => {
      if (!id) {
        throw new ValidationError("Image ID is required", { field: "id" });
      }

      const { getImagesDir } = await import("@/lib/utils");
      const imagesDir = getImagesDir();
      const cdnUrl =
        process.env.CDN_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3500";

      const types = ["concept-art", "sprite", "texture", "icon", "other"];

      for (const type of types) {
        const typeDir = path.join(imagesDir, type);
        try {
          const files = await fs.readdir(typeDir);
          for (const filename of files) {
            const fileId = filename.replace(/\.[^.]+$/, "");
            if (fileId === id) {
              const filepath = path.join(typeDir, filename);
              const stats = await fs.stat(filepath);

              return NextResponse.json({
                id,
                filename,
                url: `${cdnUrl}/api/images/file/${type}/${filename}`,
                type,
                createdAt: stats.mtime.toISOString(),
                size: stats.size,
              });
            }
          }
        } catch {
          // Directory doesn't exist
        }
      }

      throw new StorageError("Image not found", {
        operation: "read",
        storageType: "local",
        context: { id },
      });
    })(),
  );
}

/**
 * Delete an image by ID
 */
function deleteImageById(id: string): Promise<NextResponse> {
  return Promise.resolve(
    (async () => {
      if (!id) {
        throw new ValidationError("Image ID is required", { field: "id" });
      }

      // CDN assets cannot be deleted
      if (id.startsWith("cdn_")) {
        throw new AuthError("CDN assets are read-only and cannot be deleted");
      }

      const { getImagesDir } = await import("@/lib/utils");
      const imagesDir = getImagesDir();
      const { getUploadsDir } = await import("@/lib/utils");
      const uploadsDir = getUploadsDir();
      const types = ["concept-art", "sprite", "texture", "icon", "other"];

      for (const type of types) {
        const typeDir = path.join(imagesDir, type);
        try {
          const files = await fs.readdir(typeDir);
          for (const filename of files) {
            const fileId = filename.replace(/\.[^.]+$/, "");
            if (fileId === id) {
              await fs.unlink(path.join(typeDir, filename));
              log.info({ id, filename }, "Deleted image");
              return NextResponse.json({ success: true, deleted: filename });
            }
          }
        } catch {
          // Directory doesn't exist
        }
      }

      // Check uploads directory
      try {
        const files = await fs.readdir(uploadsDir);
        for (const filename of files) {
          const fileId = filename.replace(/\.[^.]+$/, "");
          if (fileId === id) {
            await fs.unlink(path.join(uploadsDir, filename));
            log.info({ id, filename }, "Deleted image from uploads");
            return NextResponse.json({ success: true, deleted: filename });
          }
        }
      } catch {
        // Uploads directory doesn't exist
      }

      throw new StorageError("Image not found", {
        operation: "delete",
        storageType: "local",
        context: { id },
      });
    })(),
  );
}

/**
 * Serve image file using unified storage (Supabase → Local fallback)
 */
function serveImageFile(pathParts: string[]): Promise<NextResponse> {
  return Promise.resolve(
    (async () => {
      if (!pathParts || pathParts.length < 2) {
        throw new ValidationError(
          "Invalid path - must include type and filename",
          {
            field: "path",
            context: { received: pathParts },
          },
        );
      }

      const { storageService } = await import("@/lib/storage");

      // First part is typically the type (concept-art, sprite, texture, reference)
      const type = pathParts[0] as "concept-art" | "sprite" | "texture" | "reference";
      const remainingPath = pathParts.slice(1);

      // Try to download from unified storage
      const buffer = await storageService.downloadImage(remainingPath, type);

      if (!buffer) {
        throw new StorageError("Image file not found", {
          operation: "read",
          storageType: "unified",
          context: { path: pathParts.join("/") },
        });
      }

      // Create file response with proper headers
      const filename = pathParts[pathParts.length - 1] || "image";
      const { createFileResponse } = await import("@/lib/utils");

      log.debug({ path: pathParts.join("/") }, "Served image file");

      return createFileResponse(buffer, filename);
    })(),
  );
}

/**
 * Images API routes
 */
export const imagesRoutes = {
  GET: {
    list: createGetRoute(listImages),
    byId: (id: string) => createGetRoute(() => getImageById(id)),
    file: (pathParts: string[]) =>
      createGetRoute(() => serveImageFile(pathParts)),
  },
  POST: {
    generate: createPostRoute(
      ImageGenerateSchema as z.ZodType<ReturnType<typeof ImageGenerateSchema.parse>, z.ZodTypeDef, unknown>,
      generateImage as ValidatedHandler<
        ReturnType<typeof ImageGenerateSchema.parse>
      >,
    ),
  },
  DELETE: {
    byId: (id: string) => createDeleteRoute(() => deleteImageById(id)),
  },
};
