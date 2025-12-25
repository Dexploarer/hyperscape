/**
 * Export/Import API Router
 * 
 * Handles asset export and import operations
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import {
  createGetRoute,
  createPostRoute,
} from "./base";
import {
  ValidationError,
  StorageError,
  ExportRequestSchema,
  ImportAssetsRequestSchema,
  ManifestExportRequestSchema,
  ManifestImportRequestSchema,
} from "@/lib/api";
import type { ValidatedHandler } from "./types";
import type { ParsedGameAsset } from "@/lib/import";
import type { AssetCategory, AssetSource, AssetType } from "@/types/core";
import type { ZodSchema } from "zod";
import type { RegistryAsset } from "@/lib/assets/registry";

const log = logger.child("API:routing:export-import");

/**
 * Export asset to game server
 */
export async function exportAsset(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof ExportRequestSchema.parse>,
): Promise<NextResponse> {
  const { promises: fs } = await import("fs");
  const path = await import("path");

  const { assetId, targetType, manifestEntry } = body;

  const { getServerManifestsDir, getServerModelsDir, getAssetsBaseDir, getServerAvatarsDir } = await import("@/lib/utils");
  const MANIFESTS_PATH = getServerManifestsDir();
  const MODELS_PATH = getServerModelsDir();
  const AVATARS_PATH = getServerAvatarsDir();
  const LOCAL_ASSETS_PATH = getAssetsBaseDir();

  const localAssetDir = path.join(LOCAL_ASSETS_PATH, assetId);

  try {
    await fs.access(localAssetDir);
  } catch {
    throw new StorageError(`Asset not found: ${assetId}`, {
      operation: "read",
      storageType: "local",
      context: { assetId },
    });
  }

  const modelPath = path.join(localAssetDir, "model.glb");

  // Copy model to server
  const targetDir = targetType === "avatar" ? AVATARS_PATH : MODELS_PATH;
  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(modelPath, path.join(targetDir, `${assetId}.glb`));

  // Update manifest if provided
  if (manifestEntry) {
    const manifestFile = path.join(MANIFESTS_PATH, `${targetType}s.json`);
    const manifest = JSON.parse(await fs.readFile(manifestFile, "utf-8"));
    manifest.push(manifestEntry);
    await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
  }

  log.info("Exported asset", { assetId, targetType });

  return NextResponse.json({
    success: true,
    assetId,
    targetType,
    message: "Asset exported successfully",
  });
}

/**
 * Import assets from game manifests
 */
export async function importAssets(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof ImportAssetsRequestSchema.parse>,
): Promise<NextResponse> {
  const {
    loadAllGameManifests,
    importSelectedAssets,
  } = await import("@/lib/import");

  const { assetIds } = body;

  const parsed = await loadAllGameManifests();
  
  // Collect all parsed assets
  const allAssets: ParsedGameAsset[] = [
    ...parsed.items,
    ...parsed.npcs,
    ...parsed.resources,
    ...parsed.stores,
    ...parsed.music || [],
  ];

  const results = await importSelectedAssets(assetIds, allAssets);

  return NextResponse.json({
    success: results.success,
    imported: results.imported.length,
    failed: results.failed.length,
    skipped: results.skipped.length,
    results,
  });
}

/**
 * List importable assets
 */
export async function listImportableAssets(): Promise<NextResponse> {
  const {
    loadAllGameManifests,
    manifestsExist,
  } = await import("@/lib/import");

  if (!manifestsExist()) {
    return NextResponse.json({
      success: false,
      error: "Game manifests not found",
    });
  }

  const assets = await loadAllGameManifests();

  return NextResponse.json({
    success: true,
    assets,
  });
}

/**
 * Export manifest
 */
export async function exportManifest(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof ManifestExportRequestSchema.parse>,
): Promise<NextResponse> {
  // ManifestExportRequestSchema is used in type annotation above
  const { generateManifestEntry } = await import("@/lib/manifest/manifest-exporter");
  const { getAssetById } = await import("@/lib/assets");
  const { promises: fs } = await import("fs");
  const path = await import("path");

  const { assetId, assets, action } = body;

  const { getServerManifestsDir } = await import("@/lib/utils");
  const MANIFESTS_DIR = getServerManifestsDir();

  const results = [];
  const errors = [];
  const manifestGroups = new Map<string, { entries: unknown[] }>();

  // Handle single asset or batch
  const assetList = assetId ? [{ assetId, category: body.category, metadata: body.metadata, modelPath: body.modelPath }] : (assets || []);

  for (const assetConfig of assetList) {
    try {
      const id = assetConfig.assetId;
      if (!id) {
        throw new ValidationError("Asset ID is required", { field: "assetId" });
      }

      const asset = await getAssetById(id);
      if (!asset) {
        throw new ValidationError(`Asset not found: ${id}`, {
          field: "assetId",
        });
      }

      const category = (asset.category || assetConfig.category || "item") as AssetCategory;
      const metadata = assetConfig.metadata || (asset.metadata as Record<string, unknown>) || {};
      const modelPath = assetConfig.modelPath || asset.path || asset.url;

      const entry = generateManifestEntry(category, metadata, modelPath);
      const manifestFile = `${asset.category}s.json`;
      if (!manifestGroups.has(manifestFile)) {
        manifestGroups.set(manifestFile, { entries: [] });
      }
      manifestGroups.get(manifestFile)!.entries.push(entry);

      results.push({ assetId, action: "preview", entry });
    } catch (error) {
      errors.push({
        assetId,
        error: error instanceof Error ? error.message : "Processing failed",
      });
    }
  }

  if (action === "preview") {
    return NextResponse.json({
      success: errors.length === 0,
      isBatch: assetList.length > 1,
      count: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: "Preview only - use action: 'write' to save to manifests",
    });
  }

  const writeResults = [];

  for (const [manifestFileName, { entries }] of manifestGroups) {
    const manifestPath = path.join(MANIFESTS_DIR, manifestFileName);
    let existingManifest = [];
    try {
      const content = await fs.readFile(manifestPath, "utf-8");
      existingManifest = JSON.parse(content);
    } catch {
      // File doesn't exist
    }

    let added = 0;
    let updated = 0;

    for (const entry of entries) {
      const existingIndex = existingManifest.findIndex(
        (e: { id: string }) => e.id === (entry as { id: string }).id,
      );
      if (existingIndex >= 0) {
        existingManifest[existingIndex] = entry;
        updated++;
      } else {
        existingManifest.push(entry);
        added++;
      }
    }

    await fs.writeFile(manifestPath, JSON.stringify(existingManifest, null, 2));
    writeResults.push({
      manifestFile: manifestFileName,
      added,
      updated,
      total: existingManifest.length,
    });
  }

  return NextResponse.json({
    success: errors.length === 0,
    isBatch: assetList.length > 1,
    count: results.length,
    results,
    writeResults,
    errors: errors.length > 0 ? errors : undefined,
    message: `Exported ${results.length} assets to ${writeResults.length} manifest(s)`,
  });
}

/**
 * Import manifests
 */
export async function importManifests(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof ManifestImportRequestSchema.parse>,
): Promise<NextResponse> {
  // ManifestImportRequestSchema is used in type annotation above
  const {
    importFromManifests,
    importItems,
    importNpcs,
    importResources,
    importStores,
    importMusic,
  } = await import("@/lib/import/manifest-importer");
  const { listForgeAssets } = await import("@/lib/storage");

  const { direction, manifestTypes } = body;

  if (direction === "from_game") {
    const forgeAssets = await listForgeAssets();
    
    // Convert ForgeAsset[] to RegistryAsset[]
    const registryAssets = forgeAssets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      source: asset.source as AssetSource,
      category: asset.category as AssetCategory,
      type: (asset.type || "model") as AssetType,
      url: asset.modelUrl,
      path: asset.modelPath || asset.modelUrl,
      thumbnailUrl: asset.thumbnailUrl,
      hasModel: asset.hasModel ?? true,
      hasVRM: asset.hasVRM ?? false,
      isAudio: false,
      metadata: asset.metadata || {},
    }));

    if (manifestTypes && manifestTypes.length > 0) {
      const totals = {
        added: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };
      const validResults = [];

      for (const manifestType of manifestTypes) {
        try {
          let result;
          switch (manifestType) {
            case "items":
              result = await importItems(registryAssets);
              break;
            case "npcs":
              result = await importNpcs(registryAssets);
              break;
            case "resources":
              result = await importResources(registryAssets);
              break;
            case "stores":
              result = await importStores(registryAssets);
              break;
            case "music":
              result = await importMusic(registryAssets);
              break;
            default:
              continue;
          }

          totals.added += result.status.added.length;
          totals.updated += result.status.updated.length;
          totals.skipped += result.status.skipped.length;
          totals.failed += result.status.failed.length;
          validResults.push({
            manifestType,
            success: result.success,
            status: result.status,
          });
        } catch (error) {
          totals.failed++;
          validResults.push({
            manifestType,
            success: false,
            error: error instanceof Error ? error.message : "Import failed",
          });
        }
      }

      return NextResponse.json({
        success: totals.failed === 0,
        direction,
        manifestTypes,
        totals,
        results: validResults,
      });
    } else {
      // Convert ForgeAsset[] to RegistryAsset[] for importFromManifests
      const registryAssetsForImport: RegistryAsset[] = forgeAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        source: asset.source as AssetSource,
        category: asset.category as AssetCategory,
        type: (asset.type || "model") as AssetType,
        url: asset.modelUrl,
        path: asset.modelPath || asset.modelUrl,
        thumbnailUrl: asset.thumbnailUrl,
        hasModel: asset.hasModel ?? true,
        hasVRM: asset.hasVRM ?? false,
        isAudio: false,
        metadata: asset.metadata || {},
      }));
      
      const importResult = await importFromManifests(registryAssetsForImport);
      return NextResponse.json({
        success: importResult.success,
        direction,
        totals: importResult.totals,
        results: importResult.results.map((r) => ({
          manifestType: r.manifestType,
          success: r.success,
          added: r.status.added.length,
          updated: r.status.updated.length,
          skipped: r.status.skipped.length,
          failed: r.status.failed.length,
        })),
        timestamp: importResult.timestamp.toISOString(),
      });
    }
  }

  throw new ValidationError(
    "Sync to game should use the manifest exporter at /api/manifest/export",
    {
      context: {
        suggestion: "Use the manifest exporter to write changes to game manifest files",
      },
    },
  );
}

/**
 * Get manifest state and diff
 */
async function getManifestDiff(): Promise<NextResponse> {
  const { getFullManifestDiff, getParsedManifests } = await import("@/lib/import/manifest-importer");
  const { listForgeAssets } = await import("@/lib/storage");

  const forgeAssets = await listForgeAssets();
  
  // Convert ForgeAsset[] to RegistryAsset[]
  const registryAssets: RegistryAsset[] = forgeAssets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    source: asset.source as AssetSource,
    category: asset.category as AssetCategory,
    type: (asset.type || "model") as AssetType,
    url: asset.modelUrl,
    path: asset.modelPath || asset.modelUrl,
    thumbnailUrl: asset.thumbnailUrl,
    hasModel: asset.hasModel ?? true,
    hasVRM: asset.hasVRM ?? false,
    isAudio: false,
    metadata: asset.metadata || {},
  }));
  
  const [diff, parsed] = await Promise.all([
    getFullManifestDiff(registryAssets),
    getParsedManifests(),
  ]);

  return NextResponse.json({
    success: true,
    diff,
    parsed,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Export/Import API routes
 */
export const exportImportRoutes = {
  GET: {
    importable: createGetRoute(listImportableAssets),
    manifestDiff: createGetRoute(getManifestDiff),
  },
  POST: {
    export: createPostRoute(
      ExportRequestSchema as unknown as ZodSchema<ReturnType<typeof ExportRequestSchema.parse>>,
      exportAsset as ValidatedHandler<
        ReturnType<typeof ExportRequestSchema.parse>
      >,
    ),
    import: createPostRoute(
      ImportAssetsRequestSchema,
      importAssets as ValidatedHandler<
        ReturnType<typeof ImportAssetsRequestSchema.parse>
      >,
    ),
    manifestExport: createPostRoute(
      ManifestExportRequestSchema as unknown as ZodSchema<ReturnType<typeof ManifestExportRequestSchema.parse>>,
      exportManifest as ValidatedHandler<
        ReturnType<typeof ManifestExportRequestSchema.parse>
      >,
    ),
    manifestImport: createPostRoute(
      ManifestImportRequestSchema,
      importManifests as ValidatedHandler<
        ReturnType<typeof ManifestImportRequestSchema.parse>
      >,
    ),
  },
};
