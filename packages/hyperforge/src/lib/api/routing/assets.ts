/**
 * Assets Domain Routing Layer
 * 
 * Consolidated asset operations for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllAssets,
  getRegistryStats,
  type RegistryQueryOptions,
} from "@/lib/assets/registry";
import {
  deleteAssetFiles,
} from "@/lib/storage/asset-storage";
import { storageService } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/storage/supabase-storage";
import {
  generateAssetId,
  createStandardMetadata,
  validateAssetId,
} from "@/lib/utils/asset-naming";
import { invalidateRegistryCache } from "@/lib/assets";
import { logger } from "@/lib/utils";
import { ValidationError, StorageError, withErrorHandling } from "@/lib/api";
import { AssetUploadMetadataSchema } from "@/lib/api/schemas/asset-schemas";
import { z } from "zod";
import type {
  RouteHandler,
} from "./types";
import {
  createGetRoute,
  parseQuery,
  getQueryArray,
  getQueryNumber,
  getQueryBoolean,
  getQueryParam,
  successResponse,
} from "./base";
import type { AssetCategory } from "@/types";
import type { CDNAsset } from "@/lib/cdn/types";

const log = logger.child("API:routing:assets");

/**
 * Query assets from registry
 */
export async function queryAssets(
  request: NextRequest,
): Promise<NextResponse> {
  const query = parseQuery(request);

  // Parse query parameters
  const sourceParam = getQueryArray(query, "source");
  const categoryParam = getQueryArray(query, "category");
  const typeParam = getQueryArray(query, "type");
  const search = getQueryParam(query, "search");
  const includeAudio = getQueryBoolean(query, "includeAudio", true);
  const includeImages = getQueryBoolean(query, "includeImages", false);
  const includeStats = getQueryBoolean(query, "stats", false);
  const limit = getQueryNumber(query, "limit", { min: 1, max: 1000 });
  const offset = getQueryNumber(query, "offset", { min: 0 });

  // Build query options
  const options: RegistryQueryOptions = {
    source:
      sourceParam && sourceParam.length === 1
        ? (sourceParam[0] as RegistryQueryOptions["source"])
        : (sourceParam as RegistryQueryOptions["source"]),
    category:
      categoryParam && categoryParam.length === 1
        ? (categoryParam[0] as AssetCategory)
        : (categoryParam as AssetCategory[]),
    type:
      typeParam && typeParam.length === 1
        ? (typeParam[0] as RegistryQueryOptions["type"])
        : (typeParam as RegistryQueryOptions["type"]),
    search,
    includeAudio,
    includeImages,
    limit,
    offset,
  };

  log.debug("Querying assets", options);

  // Fetch assets
  const assets = await getAllAssets(options);

  // Optionally include stats
  let stats;
  if (includeStats) {
    stats = await getRegistryStats();
  }

  log.info("Assets queried", {
    count: assets.length,
    source: sourceParam,
    category: categoryParam,
    type: typeParam,
    search,
  });

  return NextResponse.json({
    success: true,
    assets,
    total: assets.length,
    ...(stats && { stats }),
  });
}

/**
 * Get a single asset by ID with three-tier lookup:
 * 1. CDN (main Hyperscape repo)
 * 2. Supabase (FORGE assets)
 * 3. Local filesystem
 */
export async function getAssetById(
  assetId: string,
): Promise<NextResponse> {
  const { loadCDNAssets } = await import("@/lib/cdn/loader");
  const {
    getForgeAsset,
    isSupabaseConfigured,
  } = await import("@/lib/storage/supabase-storage");
  const { readAssetMetadata, assetExists } = await import(
    "@/lib/storage/asset-storage"
  );

  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "http://localhost:8080";

  // 1. Check CDN assets first
  try {
    const cdnAssets = await loadCDNAssets();
    const cdnAsset = cdnAssets.find((a) => a.id === assetId);
    if (cdnAsset) {
      return NextResponse.json({
        ...cdnAsset,
        modelUrl: cdnAsset.modelPath.startsWith("asset://")
          ? cdnAsset.modelPath.replace("asset://", `${CDN_URL}/`)
          : `${CDN_URL}/${cdnAsset.modelPath}`,
        thumbnailUrl: cdnAsset.thumbnailPath
          ? cdnAsset.thumbnailPath.startsWith("asset://")
            ? cdnAsset.thumbnailPath.replace("asset://", `${CDN_URL}/`)
            : `${CDN_URL}/${cdnAsset.thumbnailPath}`
          : undefined,
      });
    }
  } catch (error) {
    log.warn("CDN lookup failed", { error });
  }

  // 2. Check Supabase FORGE assets
  if (isSupabaseConfigured()) {
    try {
      const forgeAsset = await getForgeAsset(assetId);
      if (forgeAsset) {
        return NextResponse.json({
          id: forgeAsset.id,
          name: forgeAsset.name,
          source: "LOCAL",
          modelPath: forgeAsset.modelUrl,
          modelUrl: forgeAsset.modelUrl,
          thumbnailPath: forgeAsset.thumbnailUrl,
          thumbnailUrl: forgeAsset.thumbnailUrl,
          vrmPath: forgeAsset.vrmPath,
          vrmUrl: forgeAsset.vrmUrl,
          previewUrl: forgeAsset.previewUrl,
          hasVRM: forgeAsset.hasVRM,
          hasModel: forgeAsset.hasModel,
          category: forgeAsset.category as CDNAsset["category"],
          type: forgeAsset.type,
          createdAt: forgeAsset.createdAt,
          metadata: forgeAsset.metadata,
        });
      }
    } catch (error) {
      log.warn("Supabase lookup failed", { error });
    }
  }

  // 3. Check local filesystem
  const existsLocally = await assetExists(assetId);
  if (existsLocally) {
    const metadata = await readAssetMetadata(assetId);
    if (metadata) {
      return NextResponse.json({
        id: assetId,
        name: (metadata.name as string) || assetId,
        source: "LOCAL",
        modelPath: `/api/assets/${assetId}/model.glb`,
        modelUrl: `/api/assets/${assetId}/model.glb`,
        thumbnailPath: `/api/assets/${assetId}/concept-art.png`,
        thumbnailUrl: `/api/assets/${assetId}/concept-art.png`,
        vrmUrl: metadata.hasVRM ? `/api/assets/${assetId}/model.vrm` : undefined,
        hasVRM: !!metadata.hasVRM,
        hasModel: true,
        category:
          (metadata.category as CDNAsset["category"]) ||
          (metadata.type as CDNAsset["category"]) ||
          "item",
        type: (metadata.type as string) || "object",
        status: metadata.status || "completed",
        createdAt: metadata.createdAt,
        metadata,
      });
    }
  }

  return NextResponse.json({ error: "Asset not found" }, { status: 404 });
}

/**
 * Upload asset files
 * Handles FormData uploads (not JSON)
 */
export async function uploadAsset(
  request: NextRequest,
): Promise<NextResponse> {
  const formData = await request.formData();

  // Get and validate model file
  const modelFile = formData.get("model") as File | null;
  if (!modelFile) {
    throw new ValidationError("No model file provided", {
      field: "model",
    });
  }

  // Validate file extension
  const fileName = modelFile.name.toLowerCase();
  let format: "glb" | "gltf" | "vrm";
  if (fileName.endsWith(".vrm")) {
    format = "vrm";
  } else if (fileName.endsWith(".gltf")) {
    format = "gltf";
  } else if (fileName.endsWith(".glb")) {
    format = "glb";
  } else {
    throw new ValidationError(
      "Invalid file type. Supported formats: GLB, GLTF, VRM",
      {
        field: "model",
        validationDetails: {
          model: ["File must have .glb, .gltf, or .vrm extension"],
        },
      },
    );
  }

  // Get thumbnail file (optional)
  const thumbnailFile = formData.get("thumbnail") as File | null;

  // Parse metadata
  const metadataJson = formData.get("metadata") as string | null;
  let metadata: z.infer<typeof AssetUploadMetadataSchema>;

  if (!metadataJson) {
    metadata = {
      name: modelFile.name.replace(/\.[^.]+$/, ""),
      category: "item",
    };
  } else {
    try {
      const parsed = JSON.parse(metadataJson);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("Expected object");
      }
      metadata = {
        name: modelFile.name.replace(/\.[^.]+$/, ""),
        category: "item",
        ...parsed,
      };
    } catch {
      throw new ValidationError("Invalid metadata JSON format", {
        field: "metadata",
      });
    }
  }

  // Generate asset ID
  const assetId = generateAssetId(metadata.name, {
    category: metadata.category,
    type: metadata.type,
  });

  // Validate the generated ID
  const validation = validateAssetId(assetId);
  if (!validation.valid) {
    log.warn("Generated asset ID has issues", {
      assetId,
      issues: validation.issues,
    });
  }

  // Convert files to buffers
  const modelBuffer = Buffer.from(await modelFile.arrayBuffer());
  const thumbnailBuffer = thumbnailFile
    ? Buffer.from(await thumbnailFile.arrayBuffer())
    : undefined;

  // Determine source
  const initialSource = isSupabaseConfigured() ? "FORGE" : "LOCAL";

  // Build standard metadata
  const standardMeta = createStandardMetadata(assetId, {
    name: metadata.name.trim(),
    type: metadata.type || metadata.category,
    subtype: (metadata as { weaponType?: string; npcCategory?: string })
      .weaponType ||
      (metadata as { weaponType?: string; npcCategory?: string })
        .npcCategory,
    description: metadata.description || `Uploaded ${metadata.category}`,
    source: initialSource,
    workflow: "Manual Upload",
    hasModel: true,
    hasConceptArt: !!thumbnailFile,
  });

  // Build full metadata (spread metadata first, then override with standardMeta and id)
  const fullMetadata = {
    ...metadata,
    ...standardMeta,
    id: assetId,
    status: "completed" as const,
    updatedAt: new Date().toISOString(),
    originalFileName: modelFile.name,
    fileSize: modelFile.size,
  };

  // Upload model using unified storage service (automatic Supabase → Local fallback)
  const uploadResult = await storageService.uploadModel(modelBuffer, {
    assetId,
    format: format as "glb" | "vrm" | "gltf",
    thumbnailBuffer,
    metadata: fullMetadata,
  });

  if (!uploadResult.success) {
    throw new StorageError(uploadResult.error || "Failed to upload model", {
      operation: "write",
      storageType: uploadResult.backend,
      context: { assetId },
    });
  }

  const savedFiles = {
    modelUrl: uploadResult.url,
    thumbnailUrl: thumbnailBuffer ? uploadResult.url.replace(/\.glb$/, "-thumb.png") : undefined,
  };

  // Invalidate registry cache
  invalidateRegistryCache();

  log.info("Asset uploaded successfully", { assetId, format });

  return successResponse({
    ...fullMetadata,
    modelUrl: savedFiles.modelUrl,
    thumbnailUrl: savedFiles.thumbnailUrl,
  });
}

/**
 * Delete an asset
 */
export async function deleteAsset(
  assetId: string,
): Promise<NextResponse> {
  try {
    await deleteAssetFiles(assetId);
    invalidateRegistryCache();

    log.info("Asset deleted", { assetId });

    return successResponse({ assetId, deleted: true });
  } catch (error) {
    throw new StorageError("Failed to delete asset", {
      operation: "delete",
      storageType: isSupabaseConfigured() ? "supabase" : "local",
      cause: error instanceof Error ? error : undefined,
      context: { assetId },
    });
  }
}

/**
 * Serve asset file using unified storage (Supabase → Local fallback)
 */
export async function serveAssetFile(
  filePath: string[],
  _baseDir?: string,
): Promise<NextResponse> {
  const { storageService } = await import("@/lib/storage");

  // Try to download from unified storage
  const buffer = await storageService.downloadFile(filePath);

  if (!buffer) {
    throw new StorageError("Asset file not found", {
      storageType: "unified",
      operation: "read",
      isRetryable: false,
      context: { path: filePath.join("/") },
    });
  }

  // Create file response with proper headers
  const filename = filePath[filePath.length - 1] || "file";
  const { createFileResponse } = await import("@/lib/utils");
  return createFileResponse(buffer, filename);
}

/**
 * Upload route handler wrapper (handles FormData, not JSON)
 */
const uploadAssetHandler: RouteHandler = withErrorHandling(uploadAsset);

/**
 * Update asset metadata
 */
export async function updateAsset(
  assetId: string,
  updates: Record<string, unknown>,
): Promise<NextResponse> {
  const { promises: fs } = await import("fs");
  const { getMetadataPath, assetExists } = await import(
    "@/lib/storage/asset-storage"
  );

  const exists = await assetExists(assetId);
  if (!exists) {
    throw new ValidationError("Asset not found", {
      field: "id",
      context: { assetId },
    });
  }

  // Read existing metadata
  const metadataPath = getMetadataPath(assetId);
  let metadata: Record<string, unknown> = {};
  try {
    const content = await fs.readFile(metadataPath, "utf-8");
    metadata = JSON.parse(content);
  } catch {
    // No existing metadata
  }

  // Merge updates
  const updatedMetadata = {
    ...metadata,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Write updated metadata
  await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));

  invalidateRegistryCache();

  return successResponse(updatedMetadata);
}

/**
 * Download asset model file using unified storage (Supabase → Local fallback)
 */
export async function downloadAssetModel(
  assetId: string,
  format: string,
): Promise<NextResponse> {
  const { storageService } = await import("@/lib/storage");

  // Try to download from unified storage
  const buffer = await storageService.downloadModel(
    assetId,
    format as "glb" | "vrm" | "gltf",
  );

  if (!buffer) {
    throw new StorageError(`Model file not found for asset: ${assetId}`, {
      operation: "read",
      storageType: "unified",
      context: { assetId, requestedFormat: format },
    });
  }

  // Create model response with attachment disposition
  const actualFormat = format as "glb" | "vrm" | "gltf";
  const { createModelResponse } = await import("@/lib/utils");
  return createModelResponse(buffer, assetId, actualFormat, "attachment");
}

/**
 * Duplicate an asset
 */
export async function duplicateAsset(
  assetId: string,
  newName?: string,
): Promise<NextResponse> {
  const {
    assetExists,
    copyAssetFiles,
    readAssetMetadata,
    getMetadataPath,
  } = await import("@/lib/storage/asset-storage");
  const { promises: fs } = await import("fs");

  const exists = await assetExists(assetId);
  if (!exists) {
    throw new ValidationError("Source asset not found", {
      field: "id",
      context: { assetId },
    });
  }

  // Generate new asset ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const newAssetId = `${assetId}_copy_${timestamp}_${random}`;

  // Copy all files
  const files = await copyAssetFiles(assetId, newAssetId);

  // Read source metadata and update it
  const sourceMetadata = await readAssetMetadata(assetId);
  let newMetadata = sourceMetadata;

  if (sourceMetadata) {
    const baseName = newName || sourceMetadata.name || assetId;
    const finalName = newName ? baseName : `${baseName} (Copy)`;

    newMetadata = {
      ...sourceMetadata,
      id: newAssetId,
      name: finalName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceAssetId: assetId,
    };

    const metadataPath = getMetadataPath(newAssetId);
    await fs.writeFile(metadataPath, JSON.stringify(newMetadata, null, 2));
  }

  invalidateRegistryCache();

  return successResponse({
    success: true,
    message: "Asset duplicated successfully",
    asset: {
      id: newAssetId,
      name: newMetadata?.name || `${assetId} (Copy)`,
      ...files,
      metadata: newMetadata,
    },
  });
}

/**
 * Serve asset model file using unified storage (CDN → Supabase → Local)
 */
export async function serveAssetModel(
  assetId: string,
  format?: string,
): Promise<NextResponse> {
  const { loadCDNAssets } = await import("@/lib/cdn/loader");
  const { storageService } = await import("@/lib/storage");
  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "http://localhost:8080";

  // 1. Check CDN first (redirect to CDN URL)
  try {
    const cdnAssets = await loadCDNAssets();
    const cdnAsset = cdnAssets.find((a) => a.id === assetId);
    if (cdnAsset?.modelPath) {
      const modelUrl = cdnAsset.modelPath.startsWith("asset://")
        ? cdnAsset.modelPath.replace("asset://", `${CDN_URL}/`)
        : `${CDN_URL}/${cdnAsset.modelPath}`;
      return NextResponse.redirect(modelUrl);
    }
  } catch {
    // Continue to unified storage
  }

  // 2. Use unified storage (Supabase → Local fallback)
  const modelFormat = (format || "glb") as "glb" | "vrm" | "gltf";
  const buffer = await storageService.downloadModel(assetId, modelFormat);

  if (!buffer) {
    throw new StorageError("Model not found", {
      operation: "read",
      storageType: "unified",
      context: { assetId, format: modelFormat },
    });
  }

  // Create model response with proper headers
  const { createModelResponse } = await import("@/lib/utils");
  return createModelResponse(buffer, assetId, modelFormat, "inline");
}

/**
 * Export route handlers for assets domain
 */
export const assetsRoutes = {
  GET: {
    list: createGetRoute(queryAssets),
    byId: (assetId: string) =>
      createGetRoute(async () => getAssetById(assetId)),
    file: (filePath: string[]) =>
      createGetRoute(async () => serveAssetFile(filePath)),
    download: (assetId: string, format: string) =>
      createGetRoute(async () => downloadAssetModel(assetId, format)),
    model: (assetId: string, format?: string) =>
      createGetRoute(async () => serveAssetModel(assetId, format)),
  },
  POST: {
    upload: uploadAssetHandler,
    duplicate: (assetId: string) =>
      withErrorHandling(async (request: NextRequest) => {
        const body = await request.json().catch(() => ({}));
        const newName = body.newName as string | undefined;
        return duplicateAsset(assetId, newName);
      }),
  },
  PATCH: {
    byId: (assetId: string) =>
      withErrorHandling(async (request: NextRequest) => {
        const updates = await request.json();
        return updateAsset(assetId, updates);
      }),
  },
  DELETE: {
    byId: (assetId: string) =>
      createGetRoute(async () => deleteAsset(assetId)),
  },
};
