/**
 * Sprites API Router
 * 
 * Handles sprite generation operations
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/utils";
import { createPostRoute } from "./base";
import { SpriteGenerateSchema, ValidationError } from "@/lib/api";
import type { ValidatedHandler } from "./types";
import { getAssetById } from "@/lib/assets/registry";
import { invalidateRegistryCache } from "@/lib/assets/registry";

const log = logger.child("API:routing:sprites");

/**
 * Generate sprites for an asset
 */
export async function generateSprites(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof SpriteGenerateSchema.parse>,
): Promise<NextResponse> {
  const {
    generateSpritesForAsset,
  } = await import("@/lib/ai/sprite-service");
  const { storageService } = await import("@/lib/storage");

  const { assetId, assetName, assetDescription, assetCategory, views, style } = body;

  // Get asset from registry to get modelUrl and thumbnailUrl
  const asset = await getAssetById(assetId);
  if (!asset) {
    throw new ValidationError(`Asset not found: ${assetId}`, { field: "assetId" });
  }

  const assetInfo = {
    id: assetId,
    name: assetName || asset.name || assetId,
    description: assetDescription || asset.description,
    category: assetCategory || asset.category,
    modelUrl: asset.url || asset.path,
    thumbnailUrl: asset.thumbnailUrl,
  };

  log.info("Generating sprites", { assetId });

  const sprites = await generateSpritesForAsset(assetInfo, {
    views: views || undefined,
    style: style || undefined,
  });

  // Upload sprites using unified storage service (automatic Supabase → Local fallback)
  const spriteUrls: Record<string, string> = {};
  const uploadPromises = sprites.map(async (sprite) => {
    // Convert base64 to buffer
    const buffer = sprite.base64 ? Buffer.from(sprite.base64, "base64") : Buffer.from([]);
    
    const uploadResult = await storageService.uploadImage(buffer, {
      type: "sprite",
      filename: `sprite-${sprite.angle}`,
      contentType: sprite.mediaType || (await import("@/lib/utils")).DEFAULT_CONTENT_TYPES.image,
      assetId,
      metadata: {
        view: sprite.angle,
        assetCategory: assetCategory || asset.category,
        assetName: assetName || asset.name,
      },
    });

    if (uploadResult.success) {
      spriteUrls[sprite.angle] = uploadResult.url;
    } else {
      log.warn({ view: sprite.angle, error: uploadResult.error }, "Failed to upload sprite");
      // Fallback URL will be handled by storageService's local fallback
      spriteUrls[sprite.angle] = uploadResult.url || sprite.imageUrl || "";
    }
  });

  await Promise.all(uploadPromises);

  invalidateRegistryCache();

  return NextResponse.json({
    success: true,
    assetId,
    sprites: spriteUrls,
  });
}

/**
 * Sprites API routes
 */
export const spritesRoutes = {
  POST: {
    generate: createPostRoute(
      SpriteGenerateSchema as z.ZodType<ReturnType<typeof SpriteGenerateSchema.parse>, z.ZodTypeDef, unknown>,
      generateSprites as ValidatedHandler<
        ReturnType<typeof SpriteGenerateSchema.parse>
      >,
    ),
  },
};
