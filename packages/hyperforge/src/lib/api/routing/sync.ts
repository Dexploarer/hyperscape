/**
 * Sync API Router
 * 
 * Handles synchronization between HyperForge and game manifests
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import {
  createGetRoute,
  createPostRoute,
} from "./base";
import {
  StorageError,
  SyncRequestSchema,
} from "@/lib/api";
import type { ValidatedHandler } from "./types";
import type { HyperForgeAsset } from "@/types/asset";
import type { AssetSource, AssetCategory } from "@/types/core";

const log = logger.child("API:routing:sync");

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<NextResponse> {
  const {
    getSyncStatus: getStatus,
    manifestsExist,
  } = await import("@/lib/import");

  if (!manifestsExist()) {
    return NextResponse.json({
      success: false,
      error: "Game manifests not found",
    });
  }

  const { listForgeAssets } = await import("@/lib/storage");
  const { getSyncStatus } = await import("@/lib/import");
  
  const forgeAssets = await listForgeAssets();
  // Convert ForgeAsset[] to HyperForgeAsset[]
  // HyperForgeAsset is a union type (CDNAsset | LocalAsset | BaseTemplateAsset)
  // Since these are FORGE assets, we create LocalAssetCompleted which is the most complete type
  const hyperForgeAssets: HyperForgeAsset[] = forgeAssets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    source: "LOCAL" as const,
    category: asset.category as AssetCategory,
    modelUrl: asset.modelUrl,
    thumbnailUrl: asset.thumbnailUrl,
    status: "completed" as const,
    hasModel: true,
    metadata: {
      prompt: "",
      pipeline: "",
      quality: "",
      generatedAt: new Date().toISOString(),
      ...asset.metadata,
    },
  } as HyperForgeAsset));
  
  const status = await getSyncStatus(hyperForgeAssets);

  return NextResponse.json({
    success: true,
    status,
  });
}

/**
 * Sync with game
 */
export async function syncWithGame(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof SyncRequestSchema.parse>,
): Promise<NextResponse> {
  const {
    syncWithGame: sync,
    manifestsExist,
  } = await import("@/lib/import");

  if (!manifestsExist()) {
    throw new StorageError("Game manifests not found", {
      operation: "read",
      storageType: "local",
    });
  }

  const { direction, assetIds } = body;
  const { listForgeAssets } = await import("@/lib/storage");
  
  // Convert assetIds to HyperForgeAsset[] if provided, otherwise use all assets
  // HyperForgeAsset is a union type (CDNAsset | LocalAsset | BaseTemplateAsset)
  // Since these are FORGE assets, we create LocalAssetCompleted which is the most complete type
  let forgeAssets: HyperForgeAsset[] = [];
  if (assetIds && assetIds.length > 0) {
    const allAssets = await listForgeAssets();
    forgeAssets = allAssets
      .filter((asset) => assetIds.includes(asset.id))
      .map((asset): HyperForgeAsset => ({
        id: asset.id,
        name: asset.name,
        source: "LOCAL" as const,
        category: asset.category as AssetCategory,
        modelUrl: asset.modelUrl,
        thumbnailUrl: asset.thumbnailUrl,
        status: "completed" as const,
        hasModel: true,
        metadata: {
          prompt: "",
          pipeline: "",
          quality: "",
          generatedAt: new Date().toISOString(),
          ...asset.metadata,
        },
      }));
  } else {
    const allAssets = await listForgeAssets();
    forgeAssets = allAssets.map((asset): HyperForgeAsset => ({
      id: asset.id,
      name: asset.name,
      source: "LOCAL" as const,
      category: asset.category as AssetCategory,
      modelUrl: asset.modelUrl,
      thumbnailUrl: asset.thumbnailUrl,
      status: "completed" as const,
      hasModel: true,
      metadata: {
        prompt: "",
        pipeline: "",
        quality: "",
        generatedAt: new Date().toISOString(),
        ...asset.metadata,
      },
    }));
  }

  const result = await sync(direction, forgeAssets);

  log.info("Sync completed", { direction, count: result.appliedChanges.length });

  return NextResponse.json({
    success: true,
    direction,
    status: result.status,
    appliedChanges: result.appliedChanges,
    synced: result.appliedChanges.length,
  });
}

/**
 * Sync API routes
 */
export const syncRoutes = {
  GET: {
    status: createGetRoute(getSyncStatus),
  },
  POST: {
    sync: createPostRoute(
      SyncRequestSchema,
      syncWithGame as ValidatedHandler<
        ReturnType<typeof SyncRequestSchema.parse>
      >,
    ),
  },
};
