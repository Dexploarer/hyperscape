/**
 * Game API Router
 * 
 * Handles game data operations (stores, manifests, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { logger, getServerManifestsDir } from "@/lib/utils";
import { createGetRoute, parseQuery, getQueryParam } from "./base";
import { StorageError, StoreQuerySchema } from "@/lib/api";
import type { Store, ItemStoreInfo } from "@/lib/api/schemas/game";

const log = logger.child("API:routing:game");

// Path to the manifests directory
const MANIFESTS_DIR = getServerManifestsDir();

/**
 * Read stores from manifest file
 */
async function readStoresManifest(): Promise<Store[]> {
  const storesPath = path.join(MANIFESTS_DIR, "stores.json");

  try {
    const content = await fs.readFile(storesPath, "utf-8");
    return JSON.parse(content) as Store[];
  } catch (error) {
    log.warn("Stores manifest not found or invalid, returning empty", { error });
    return [];
  }
}

/**
 * Get stores (all or filtered by itemId)
 */
export async function getStores(request: NextRequest): Promise<NextResponse> {
  const query = parseQuery(request);

  const queryResult = StoreQuerySchema.safeParse({
    storeId: getQueryParam(query, "storeId") ?? undefined,
    npcId: getQueryParam(query, "npcId") ?? undefined,
    itemId: getQueryParam(query, "itemId") ?? undefined,
  });

  if (!queryResult.success) {
    throw new StorageError("Invalid query parameters", {
      storageType: "local",
      operation: "read",
      context: { errors: queryResult.error.flatten().fieldErrors },
    });
  }

  const { itemId } = queryResult.data;
  const stores = await readStoresManifest();

  // If itemId is provided, find which stores sell this item
  if (itemId) {
    const itemStores: ItemStoreInfo[] = [];

    for (const store of stores) {
      const storeItem = store.items.find(
        (item) => item.itemId === itemId || item.id === itemId,
      );
      if (storeItem) {
        itemStores.push({
          storeId: store.id,
          storeName: store.name,
          price: storeItem.price,
          stock:
            storeItem.stockQuantity === -1
              ? "unlimited"
              : storeItem.stockQuantity,
          buybackRate: store.buyback ? store.buybackRate : undefined,
        });
      }
    }

    log.debug("Found stores selling item", { itemId, count: itemStores.length });

    return NextResponse.json({
      itemId,
      stores: itemStores,
      totalStores: itemStores.length,
    });
  }

  // Return all stores with item counts
  const storesWithCounts = stores.map((store) => ({
    id: store.id,
    name: store.name,
    description: store.description,
    itemCount: store.items.length,
    buyback: store.buyback,
    buybackRate: store.buybackRate,
    location: store.location,
  }));

  log.debug("Returning all stores", { count: stores.length });

  return NextResponse.json({
    stores: storesWithCounts,
    totalStores: stores.length,
  });
}

/**
 * Get game manifests by type
 */
export async function getManifests(request: NextRequest): Promise<NextResponse> {
  const {
    getManifestStatus,
    getAllItems,
    getAllNpcs,
    getAllResources,
    getAllStores,
    getAllMusic,
    getAllBuildings,
    getAllAreas,
    loadAllManifests,
  } = await import("@/lib/game/manifests");
  const { GameManifestTypeSchema } = await import("@/lib/api/schemas/game");
  const { ValidationError } = await import("@/lib/api");

  const query = parseQuery(request);
  const typeParam = getQueryParam(query, "type");

  await loadAllManifests();

  if (!typeParam) {
    const status = getManifestStatus();
    return NextResponse.json({
      success: true,
      ...status,
      availableTypes: ["items", "npcs", "resources", "stores", "music", "buildings", "areas", "all"],
      usage: "Add ?type=<type> to get specific data",
    });
  }

  const typeResult = GameManifestTypeSchema.safeParse(typeParam);
  if (!typeResult.success) {
    throw new ValidationError(`Invalid manifest type: ${typeParam}`, {
      context: { availableTypes: ["items", "npcs", "resources", "stores", "music", "buildings", "areas", "all"] },
    });
  }

  const type = typeResult.data;

  switch (type) {
    case "items": {
      const items = await getAllItems();
      return NextResponse.json({ success: true, type: "items", count: items.length, data: items });
    }
    case "npcs": {
      const npcs = await getAllNpcs();
      return NextResponse.json({ success: true, type: "npcs", count: npcs.length, data: npcs });
    }
    case "resources": {
      const resources = await getAllResources();
      return NextResponse.json({ success: true, type: "resources", count: resources.length, data: resources });
    }
    case "stores": {
      const stores = await getAllStores();
      return NextResponse.json({ success: true, type: "stores", count: stores.length, data: stores });
    }
    case "music": {
      const music = await getAllMusic();
      return NextResponse.json({ success: true, type: "music", count: music.length, data: music });
    }
    case "buildings": {
      const buildings = await getAllBuildings();
      return NextResponse.json({ success: true, type: "buildings", count: buildings.length, data: buildings });
    }
    case "areas": {
      const areas = await getAllAreas();
      return NextResponse.json({ success: true, type: "areas", count: areas.length, data: areas });
    }
    case "all": {
      const [items, npcs, resources, stores, music, buildings, areas] = await Promise.all([
        getAllItems(),
        getAllNpcs(),
        getAllResources(),
        getAllStores(),
        getAllMusic(),
        getAllBuildings(),
        getAllAreas(),
      ]);
      return NextResponse.json({
        success: true,
        type: "all",
        counts: { items: items.length, npcs: npcs.length, resources: resources.length, stores: stores.length, music: music.length, buildings: buildings.length, areas: areas.length },
        data: { items, npcs, resources, stores, music, buildings, areas },
      });
    }
  }
}

/**
 * Get game data by type and id
 */
export async function getGameData(request: NextRequest): Promise<NextResponse> {
  const { promises: fs } = await import("fs");
  const { GameDataQuerySchema } = await import("@/lib/api/schemas/game");
  const { ValidationError, StorageError } = await import("@/lib/api");

  const query = parseQuery(request);
  const queryResult = GameDataQuerySchema.safeParse({
    type: getQueryParam(query, "type"),
    id: getQueryParam(query, "id"),
  });

  if (!queryResult.success) {
    throw new ValidationError("Invalid query parameters", {
      validationDetails: queryResult.error.flatten().fieldErrors as Record<string, string[]>,
    });
  }

  const { type, id } = queryResult.data;

  function getManifestFile(dataType: string): string {
    switch (dataType) {
      case "resource": return "resources.json";
      case "npc":
      case "mob": return "npcs.json";
      case "item": return "items.json";
      default: return "items.json";
    }
  }

  async function readManifest<T>(filename: string): Promise<T[]> {
    const manifestPath = path.join(MANIFESTS_DIR, filename);
    try {
      const content = await fs.readFile(manifestPath, "utf-8");
      return JSON.parse(content) as T[];
    } catch (error) {
      throw new StorageError(`Failed to read manifest: ${filename}`, {
        storageType: "local",
        operation: "read",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  const manifestFile = getManifestFile(type);
  const data = await readManifest<{ id: string; type?: string; name?: string }>(manifestFile);

  const item = data.find((entry) => entry.id === id || entry.id === id.replace("tree_", "tree_"));

  if (!item) {
    const partialMatch = data.find(
      (entry) =>
        entry.id.includes(id) ||
        entry.type === id ||
        entry.name?.toLowerCase() === id.toLowerCase(),
    );

    if (partialMatch) {
      return NextResponse.json({ type, data: partialMatch, source: manifestFile });
    }

    throw new ValidationError(`${type} with id "${id}" not found`, {
      context: { available: data.slice(0, 20).map((d) => d.id) },
    });
  }

  return NextResponse.json({ type, data: item, source: manifestFile });
}

/**
 * Get areas in editor format
 */
export async function getAreasEditor(): Promise<NextResponse> {
  const { loadAllManifests, loadWorldAreas } = await import("@/lib/game/manifests");
  const { convertWorldAreasToEditor } = await import("@/lib/world/tile-service");
  const { StorageError } = await import("@/lib/api");

  await loadAllManifests();
  const worldAreasConfig = await loadWorldAreas();

  if (!worldAreasConfig) {
    throw new StorageError("World areas configuration not found", {
      storageType: "local",
      operation: "read",
    });
  }

  const editorAreas = convertWorldAreasToEditor(worldAreasConfig);

  return NextResponse.json({
    success: true,
    areas: editorAreas.map((area) => ({
      ...area,
      tiles: Object.fromEntries(area.tiles),
    })),
  });
}

/**
 * Game API routes
 */
export const gameRoutes = {
  GET: {
    stores: createGetRoute(getStores),
    manifests: createGetRoute(getManifests),
    data: createGetRoute(getGameData),
  },
  POST: {
    areasEditor: createGetRoute(getAreasEditor), // POST uses same handler as GET
  },
};
