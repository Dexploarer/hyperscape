/**
 * Versions API Router
 * 
 * Handles version control operations (snapshots, comparisons, restores)
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import {
  createGetRoute,
  createPostRoute,
  parseQuery,
  getQueryParam,
} from "./base";
import {
  ValidationError,
  VersionQuerySchema,
  VersionCreateSchema,
  VersionRestoreSchema,
} from "@/lib/api";
import {
  listSnapshots,
  createSnapshot,
  compareSnapshots,
  restoreSnapshot,
  getVersionControlStats,
  getSnapshot,
  deleteSnapshot,
  getAssetHistory,
} from "@/lib/versioning/version-control";
import {
  getAllItems,
  getAllNpcs,
  getAllResources,
  getAllStores,
  getAllMusic,
  loadAllManifests,
} from "@/lib/game/manifests";
import type { ValidatedHandler } from "./types";
import type {
  ItemManifest,
  NPCManifest,
  ResourceManifest,
  MusicTrackManifest,
} from "@/types/manifest";

const log = logger.child("API:routing:versions");

/**
 * List snapshots or compare two snapshots
 */
export async function listVersions(request: NextRequest): Promise<NextResponse> {
  const query = parseQuery(request);
  const queryParams = {
    compare: getQueryParam(query, "compare") ?? undefined,
    to: getQueryParam(query, "to") ?? undefined,
  };

  const parsed = VersionQuerySchema.safeParse(queryParams);

  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", {
      validationDetails: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const { compare: compareFrom, to: compareTo } = parsed.data;

  if (compareFrom && compareTo) {
    const diff = await compareSnapshots(compareFrom, compareTo);
    if (!diff) {
      throw new ValidationError("One or both snapshots not found", {
        context: { compareFrom, compareTo },
      });
    }
    return NextResponse.json({ success: true, diff });
  }

  const [snapshots, stats] = await Promise.all([
    listSnapshots(),
    getVersionControlStats(),
  ]);

  return NextResponse.json({ success: true, snapshots, stats });
}

/**
 * Create a new snapshot
 */
export async function createVersion(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof VersionCreateSchema.parse>,
): Promise<NextResponse> {
  const { description, manifests: providedManifests } = body;

  let manifests;

  if (providedManifests) {
    manifests = providedManifests;
  } else {
    await loadAllManifests();

    const [items, npcs, resources, stores, music] = await Promise.all([
      getAllItems(),
      getAllNpcs(),
      getAllResources(),
      getAllStores(),
      getAllMusic(),
    ]);

    manifests = {
      items: items as unknown as ItemManifest[],
      npcs: npcs as unknown as NPCManifest[],
      resources: resources as unknown as ResourceManifest[],
      stores,
      music: music as unknown as MusicTrackManifest[],
    };
  }

  const snapshot = await createSnapshot(
    manifests as Parameters<typeof createSnapshot>[0],
    description || "Manual snapshot",
  );

  log.info("Created snapshot", {
    snapshotId: snapshot.id,
    totalAssets: snapshot.metadata.totalAssets,
  });

  return NextResponse.json({
    success: true,
    snapshot: {
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      description: snapshot.description,
      metadata: snapshot.metadata,
    },
  });
}

/**
 * Restore a snapshot
 */
export async function restoreVersion(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof VersionRestoreSchema.parse>,
): Promise<NextResponse> {
  const { snapshotId } = body;

  const manifests = await restoreSnapshot(snapshotId);

  if (!manifests) {
    throw new ValidationError("Snapshot not found", {
      field: "snapshotId",
      context: { snapshotId },
    });
  }

  log.info("Restored snapshot", { snapshotId });

  return NextResponse.json({
    success: true,
    message: `Restored snapshot ${snapshotId}`,
    manifests,
  });
}

/**
 * Get snapshot by ID
 */
export async function getVersionById(
  snapshotId: string,
  assetHistoryId?: string,
  manifestType?: string,
): Promise<NextResponse> {
  if (assetHistoryId) {
    const history = await getAssetHistory(assetHistoryId, manifestType as "items" | "npcs" | "resources" | "stores" | "music" | undefined);
    return NextResponse.json({
      success: true,
      assetId: assetHistoryId,
      history,
    });
  }

  const snapshot = await getSnapshot(snapshotId);

  if (!snapshot) {
    throw new ValidationError("Snapshot not found", {
      field: "id",
      context: { id: snapshotId },
    });
  }

  return NextResponse.json({ success: true, snapshot });
}

/**
 * Delete snapshot
 */
export async function deleteVersionById(snapshotId: string): Promise<NextResponse> {
  const deleted = await deleteSnapshot(snapshotId);

  if (!deleted) {
    throw new ValidationError("Snapshot not found", {
      field: "id",
      context: { id: snapshotId },
    });
  }

  log.info("Deleted snapshot", { snapshotId });

  return NextResponse.json({
    success: true,
    message: `Deleted snapshot ${snapshotId}`,
  });
}

/**
 * Versions API routes
 */
export const versionsRoutes = {
  GET: {
    list: createGetRoute(listVersions),
    byId: (snapshotId: string, assetHistoryId?: string, manifestType?: string) =>
      createGetRoute(async () => getVersionById(snapshotId, assetHistoryId, manifestType)),
  },
  POST: {
    create: createPostRoute(
      VersionCreateSchema,
      createVersion as ValidatedHandler<
        ReturnType<typeof VersionCreateSchema.parse>
      >,
    ),
  },
  PUT: {
    restore: createPostRoute(
      VersionRestoreSchema,
      restoreVersion as ValidatedHandler<
        ReturnType<typeof VersionRestoreSchema.parse>
      >,
    ),
  },
  DELETE: {
    byId: (snapshotId: string) =>
      createGetRoute(async () => deleteVersionById(snapshotId)),
  },
};
