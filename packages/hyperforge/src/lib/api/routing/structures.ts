/**
 * Structures API Router
 * 
 * Handles structure CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/utils";
import {
  createGetRoute,
  createPostRoute,
  parseQuery,
  getQueryParam,
} from "./base";
import {
  ValidationError,
  StorageError,
  StructureQuerySchema,
  StructureUpsertRequestSchema,
  DeleteQuerySchema,
  BuildingPieceSchema,
  TownUpsertRequestSchema,
  BakeRequestSchema,
} from "@/lib/api";
import {
  loadStructures,
  getStructure,
  upsertStructure,
  deleteStructure,
} from "@/lib/structures/structure-service";
import type { ValidatedHandler } from "./types";

const log = logger.child("API:routing:structures");

/**
 * Get structures (list or single)
 */
export async function getStructures(
  request: NextRequest,
): Promise<NextResponse> {
  const query = parseQuery(request);
  const queryResult = StructureQuerySchema.safeParse({
    id: getQueryParam(query, "id") ?? undefined,
  });

  if (!queryResult.success) {
    throw new ValidationError("Invalid query parameters", {
      validationDetails: queryResult.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const { id } = queryResult.data;

  if (id) {
    // Get single structure
    const structure = await getStructure(id);
    if (!structure) {
      throw new ValidationError(`Structure not found: ${id}`, {
        field: "id",
      });
    }
    log.debug("Retrieved structure", { id });
    return NextResponse.json(structure);
  }

  // List all structures
  const structures = await loadStructures();
  log.debug("Listed structures", { count: structures.length });
  return NextResponse.json({ structures });
}

/**
 * Create or update structure
 */
export async function upsertStructureHandler(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof StructureUpsertRequestSchema.parse>,
): Promise<NextResponse> {
  const structureData = body;

  // Build full structure with defaults
  const now = new Date().toISOString();
  const structure = {
    ...structureData,
    description: structureData.description ?? "",
    pieces: structureData.pieces ?? [],
    bounds: structureData.bounds ?? { width: 10, height: 10, depth: 10 },
    createdAt: now,
    updatedAt: now,
    enterable: structureData.enterable ?? false,
  };

  try {
    const saved = await upsertStructure(structure);
    log.info("Saved structure", { id: saved.id, pieces: saved.pieces.length });
    return NextResponse.json({ success: true, structure: saved });
  } catch (error) {
    throw new StorageError("Failed to save structure", {
      storageType: "local",
      operation: "write",
      cause: error instanceof Error ? error : undefined,
      context: { structureId: structureData.id },
    });
  }
}

/**
 * Delete structure
 */
export async function deleteStructureHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const query = parseQuery(request);
  const queryResult = DeleteQuerySchema.safeParse({
    id: getQueryParam(query, "id"),
  });

  if (!queryResult.success) {
    throw new ValidationError("Structure ID required", {
      field: "id",
    });
  }

  const { id } = queryResult.data;

  try {
    const deleted = await deleteStructure(id);
    if (!deleted) {
      throw new ValidationError(`Structure not found: ${id}`, {
        field: "id",
      });
    }

    log.info("Deleted structure", { id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new StorageError("Failed to delete structure", {
      storageType: "local",
      operation: "delete",
      cause: error instanceof Error ? error : undefined,
      context: { structureId: id },
    });
  }
}

/**
 * Get building pieces
 */
export async function getPieces(request: NextRequest): Promise<NextResponse> {
  const { PieceQuerySchema } = await import("@/lib/api/schemas");
  const { loadPieceLibrary, getPiece } = await import(
    "@/lib/structures/structure-service"
  );
  const { ValidationError } = await import("@/lib/api");

  const query = parseQuery(request);
  const queryResult = PieceQuerySchema.safeParse({
    id: getQueryParam(query, "id") ?? undefined,
    type: getQueryParam(query, "type") ?? undefined,
  });

  if (!queryResult.success) {
    throw new ValidationError("Invalid query parameters", {
      validationDetails: queryResult.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const { id, type } = queryResult.data;

  if (id) {
    const piece = await getPiece(id);
    if (!piece) {
      throw new ValidationError(`Piece not found: ${id}`, { field: "id" });
    }
    return NextResponse.json(piece);
  }

  const library = await loadPieceLibrary();
  let pieces = library.pieces;

  if (type) {
    pieces = pieces.filter((p) => p.type === type);
  }

  return NextResponse.json({
    pieces,
    categories: library.categories,
    lastUpdated: library.lastUpdated,
  });
}

/**
 * Add building piece
 */
export async function addPieceHandler(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof BuildingPieceSchema.parse>,
): Promise<NextResponse> {
  const { addPiece } = await import("@/lib/structures/structure-service");

  const piece = {
    ...body,
    thumbnailUrl: body.thumbnailUrl || "",
  };

  try {
    const saved = await addPiece(piece);
    log.info("Added piece", { id: saved.id, type: saved.type });
    return NextResponse.json({ success: true, piece: saved });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("already exists")) {
      throw new ValidationError(errorMessage, {
        field: "id",
        context: { pieceId: piece.id },
      });
    }
    throw new StorageError("Failed to add piece", {
      storageType: "local",
      operation: "write",
      cause: error instanceof Error ? error : undefined,
      context: { pieceId: piece.id },
    });
  }
}

/**
 * Delete building piece
 */
export async function deletePieceHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const { DeleteQuerySchema } = await import("@/lib/api/schemas");
  const { deletePiece } = await import("@/lib/structures/structure-service");

  const query = parseQuery(request);
  const queryResult = DeleteQuerySchema.safeParse({
    id: getQueryParam(query, "id"),
  });

  if (!queryResult.success) {
    throw new ValidationError("Piece ID required", { field: "id" });
  }

  const { id } = queryResult.data;

  try {
    const deleted = await deletePiece(id);
    if (!deleted) {
      throw new ValidationError(`Piece not found: ${id}`, { field: "id" });
    }
    log.info("Deleted piece", { id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new StorageError("Failed to delete piece", {
      storageType: "local",
      operation: "delete",
      cause: error instanceof Error ? error : undefined,
      context: { pieceId: id },
    });
  }
}

/**
 * Get towns
 */
export async function getTowns(): Promise<NextResponse> {
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const { getPublicDataDir } = await import("@/lib/utils/paths");
  const TOWNS_FILE = path.join(getPublicDataDir(), "towns.json");

  try {
    const data = await fs.readFile(TOWNS_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({
      towns: [],
      lastUpdated: new Date().toISOString(),
    });
  }
}

/**
 * Upsert town
 */
export async function upsertTown(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof TownUpsertRequestSchema.parse>,
): Promise<NextResponse> {
  // TownUpsertRequestSchema is used in type annotation above
  const { saveTown, isSupabaseConfigured } = await import("@/lib/storage/supabase-storage");
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const { getPublicDataDir } = await import("@/lib/utils/paths");

  const TOWNS_FILE = path.join(getPublicDataDir(), "towns.json");
  const now = new Date().toISOString();

  const updatedTown: {
    id: string;
    name: string;
    description: string;
    buildings: Array<{
      id: string;
      name: string;
      position: { x: number; y: number; z: number };
      rotation: number;
      scale: number;
      structureId: string;
    }>;
    bounds: { width: number; depth: number };
    createdAt: string;
    updatedAt: string;
    thumbnailUrl?: string;
    centerOffset?: { x: number; y: number; z: number };
  } = {
    id: body.id,
    name: body.name,
    description: body.description ?? "",
    buildings: body.buildings,
    bounds: body.bounds ?? { width: 100, depth: 100 },
    createdAt: now,
    updatedAt: now,
    thumbnailUrl: body.thumbnailUrl,
    centerOffset: body.centerOffset,
  };

  if (isSupabaseConfigured()) {
    try {
      await saveTown({
        townId: body.id,
        definition: updatedTown as unknown as Record<string, unknown>,
      });
    } catch {
      // Continue with local save
    }
  }

  let data: { towns: Array<typeof updatedTown>; lastUpdated: string } = { towns: [], lastUpdated: now };
  try {
    const content = await fs.readFile(TOWNS_FILE, "utf-8");
    data = JSON.parse(content);
  } catch {
    // Use defaults
  }

  const existingIndex = data.towns.findIndex((t: { id: string }) => t.id === body.id);
  if (existingIndex >= 0) {
    updatedTown.createdAt = data.towns[existingIndex].createdAt || now;
    data.towns[existingIndex] = updatedTown;
  } else {
    data.towns.push(updatedTown);
  }

  data.lastUpdated = now;
  await fs.mkdir(path.dirname(TOWNS_FILE), { recursive: true });
  await fs.writeFile(TOWNS_FILE, JSON.stringify(data, null, 2));

  return NextResponse.json({ success: true, town: updatedTown });
}

/**
 * Delete town
 */
export async function deleteTown(request: NextRequest): Promise<NextResponse> {
  const { TownDeleteQuerySchema } = await import("@/lib/api/schemas");
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const { getPublicDataDir } = await import("@/lib/utils/paths");

  const query = parseQuery(request);
  const queryResult = TownDeleteQuerySchema.safeParse({
    id: getQueryParam(query, "id"),
  });

  if (!queryResult.success) {
    throw new ValidationError("Town ID required", { field: "id" });
  }

  const { id: townId } = queryResult.data;
  const TOWNS_FILE = path.join(getPublicDataDir(), "towns.json");

  const data = JSON.parse(await fs.readFile(TOWNS_FILE, "utf-8"));
  const initialCount = data.towns.length;
  data.towns = data.towns.filter((t: { id: string }) => t.id !== townId);

  if (data.towns.length === initialCount) {
    throw new ValidationError(`Town not found: ${townId}`, { field: "id" });
  }

  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(TOWNS_FILE, JSON.stringify(data, null, 2));

  return NextResponse.json({ success: true });
}

/**
 * Generate piece - delegates to existing route handler
 */
export async function generatePiece(
  request: NextRequest,
): Promise<NextResponse> {
  // Import and call the existing POST handler directly
  const routeModule = await import("@/app/api/structures/pieces/generate/route");
  return routeModule.POST(request);
}

/**
 * Generate building - delegates to existing route handler
 */
export async function generateBuilding(
  request: NextRequest,
): Promise<NextResponse> {
  // Import and call the existing POST handler directly
  const routeModule = await import("@/app/api/structures/buildings/generate/route");
  return routeModule.POST(request);
}

/**
 * Bake structure
 */
export async function bakeStructure(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof BakeRequestSchema.parse>,
): Promise<NextResponse> {
  // BakeRequestSchema is used in type annotation above
  const { upsertStructure, loadPieceLibrary } = await import("@/lib/structures/structure-service");
  const { saveBakedBuilding, isSupabaseConfigured } = await import("@/lib/storage/supabase-storage");

  const { structure } = body;

  const pieceLibrary = await loadPieceLibrary();
  const pieceMap = new Map();
  for (const p of pieceLibrary.pieces) {
    pieceMap.set(p.id, p);
  }

  let thumbnailUrl = "";
  for (const placed of structure.pieces) {
    const piece = pieceMap.get(placed.pieceId);
    if (piece?.thumbnailUrl) {
      thumbnailUrl = piece.thumbnailUrl;
      break;
    }
  }

  const now = new Date().toISOString();
  const bakedStructure = {
    ...structure,
    thumbnailUrl,
    bakedAt: now,
  };

  if (isSupabaseConfigured()) {
    await saveBakedBuilding({
      buildingId: structure.id,
      definition: bakedStructure as unknown as Record<string, unknown>,
    });
  }

  await upsertStructure(bakedStructure);

  return NextResponse.json({
    status: "complete",
    structure: bakedStructure,
  });
}

/**
 * Get available piece generation styles
 */
async function getPieceGenerationStyles(
  request: NextRequest,
): Promise<NextResponse> {
  const { BuildingPieceTypeSchema } = await import("@/lib/api/schemas");
  
  // Prompt templates and style variants (from original implementation)
  const PIECE_PROMPTS: Record<string, string> = {
    wall: "solid rectangular wall segment, flat sides, no holes, vertical slab shape, modular building block, seamless edges on all sides, game asset, low poly, isolated object on empty background",
    door: "wall segment with door opening and frame, wooden door installed in stone wall section, same size as wall segment, modular piece, game asset, low poly, isolated object on empty background",
    window: "wall segment with window opening and frame, window hole cut into wall section, same size as wall segment, modular piece that replaces wall, game asset, low poly, isolated object on empty background",
    roof: "single flat roof tile section only, angled shingle panel, no walls, no building, just the roof piece, modular roof segment for placing on top of walls, game asset, low poly, isolated object on empty background",
    floor: "single flat floor tile only, horizontal ground panel, no walls, no building, just the floor piece, modular floor segment, flat square shape, game asset, low poly, isolated object on empty background",
  };

  const STYLE_VARIANTS: Record<string, string[]> = {
    wall: ["stone", "brick", "wood plank", "cobblestone", "marble"],
    door: ["wooden", "iron reinforced", "double wooden", "ornate carved"],
    window: ["arched stone", "square wooden", "circular stained glass", "iron barred"],
    roof: ["clay tile", "thatch straw", "slate stone", "wooden shingle"],
    floor: ["stone tile", "wood plank", "marble", "cobblestone"],
  };

  const DEFAULT_DIMENSIONS: Record<string, { width: number; height: number; depth: number }> = {
    wall: { width: 2, height: 3, depth: 0.3 },
    door: { width: 1, height: 2.5, depth: 0.15 },
    window: { width: 1, height: 1.5, depth: 0.1 },
    roof: { width: 2, height: 0.5, depth: 2 },
    floor: { width: 2, height: 0.1, depth: 2 },
  };

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  if (typeParam) {
    const typeResult = BuildingPieceTypeSchema.safeParse(typeParam);
    if (!typeResult.success) {
      throw new ValidationError(`Invalid piece type: ${typeParam}`, {
        field: "type",
        context: { validTypes: Object.keys(PIECE_PROMPTS) },
      });
    }

    const type = typeResult.data;
    return NextResponse.json({
      type,
      styles: STYLE_VARIANTS[type],
      defaultPrompt: PIECE_PROMPTS[type],
      dimensions: DEFAULT_DIMENSIONS[type],
    });
  }

  return NextResponse.json({
    types: Object.keys(PIECE_PROMPTS),
    styles: STYLE_VARIANTS,
  });
}

/**
 * Get bake status
 */
async function getBakeStatus(request: NextRequest): Promise<NextResponse> {
  const { BakeStatusQuerySchema } = await import("@/lib/api");
  const { searchParams } = new URL(request.url);
  const queryResult = BakeStatusQuerySchema.safeParse({
    jobId: searchParams.get("jobId"),
  });

  if (!queryResult.success) {
    throw new ValidationError("Job ID required", { field: "jobId" });
  }

  // For now, return completed status
  return NextResponse.json({
    jobId: queryResult.data.jobId,
    status: "complete",
    progress: 100,
  });
}

/**
 * Structures API routes
 */
export const structuresRoutes = {
  GET: {
    list: createGetRoute(getStructures),
    pieces: createGetRoute(getPieces),
    towns: createGetRoute(getTowns),
    pieceGenerationStyles: createGetRoute(getPieceGenerationStyles),
    bakeStatus: createGetRoute(getBakeStatus),
  },
  POST: {
    upsert: createPostRoute(
      StructureUpsertRequestSchema,
      upsertStructureHandler as ValidatedHandler<
        ReturnType<typeof StructureUpsertRequestSchema.parse>
      >,
    ),
    pieces: createPostRoute(
      BuildingPieceSchema as z.ZodType<ReturnType<typeof BuildingPieceSchema.parse>, z.ZodTypeDef, unknown>,
      addPieceHandler as ValidatedHandler<
        ReturnType<typeof BuildingPieceSchema.parse>
      >,
    ),
    towns: createPostRoute(
      TownUpsertRequestSchema as z.ZodType<ReturnType<typeof TownUpsertRequestSchema.parse>, z.ZodTypeDef, unknown>,
      upsertTown as ValidatedHandler<ReturnType<typeof TownUpsertRequestSchema.parse>>,
    ),
    generatePiece: generatePiece,
    generateBuilding: generateBuilding,
    bake: createPostRoute(
      BakeRequestSchema as z.ZodType<ReturnType<typeof BakeRequestSchema.parse>, z.ZodTypeDef, unknown>,
      bakeStructure as ValidatedHandler<ReturnType<typeof BakeRequestSchema.parse>>,
    ),
  },
  DELETE: {
    byId: createGetRoute(deleteStructureHandler),
    pieces: createGetRoute(deletePieceHandler),
    towns: createGetRoute(deleteTown),
  },
};
