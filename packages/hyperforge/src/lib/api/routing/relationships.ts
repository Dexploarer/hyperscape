/**
 * Relationships API Router
 * 
 * Handles asset relationship operations
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
  RelationshipCreateSchema,
  RelationshipQuerySchema,
  RelationshipDeleteSchema,
  RelationshipSearchSchema,
} from "@/lib/api";
import {
  getRelationships,
  getRelationshipGraph,
  addRelationship,
  removeRelationship,
  getRelationshipStats,
} from "@/lib/relationships/relationship-service";
import {
  type RelationshipType,
  isRelationshipType,
} from "@/lib/relationships/relationship-types";
import type { AssetCategory } from "@/types/core";
import type { ValidatedHandler } from "./types";

const log = logger.child("API:routing:relationships");

/**
 * Get relationships
 */
export async function getRelationshipsHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const query = parseQuery(request);
  const queryResult = RelationshipQuerySchema.safeParse({
    assetId: getQueryParam(query, "assetId") ?? undefined,
    assetTypes: getQueryParam(query, "assetTypes") ?? undefined,
    relationshipTypes: getQueryParam(query, "relationshipTypes") ?? undefined,
    stats: getQueryParam(query, "stats") ?? undefined,
  });

  if (!queryResult.success) {
    throw new ValidationError("Invalid query parameters", {
      validationDetails: queryResult.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const {
    assetId,
    assetTypes: assetTypesParam,
    relationshipTypes: relationshipTypesParam,
    stats,
  } = queryResult.data;

  if (stats === "true") {
    const statsData = await getRelationshipStats();
    return NextResponse.json({ success: true, stats: statsData });
  }

  const assetTypes = assetTypesParam
    ? (assetTypesParam.split(",") as AssetCategory[])
    : undefined;
  const relationshipTypes = relationshipTypesParam
    ? (relationshipTypesParam.split(",").filter(isRelationshipType) as RelationshipType[])
    : undefined;

  if (assetId) {
    const { outgoing, incoming } = await getRelationships(assetId);
    const graph = await getRelationshipGraph({
      assetId,
      assetTypes,
      relationshipTypes,
    });

    return NextResponse.json({
      success: true,
      assetId,
      outgoing,
      incoming,
      graph,
      counts: {
        outgoing: outgoing.length,
        incoming: incoming.length,
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
      },
    });
  }

  const graph = await getRelationshipGraph({
    assetTypes,
    relationshipTypes,
  });

  return NextResponse.json({
    success: true,
    graph,
    counts: {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
    },
    filters: {
      assetTypes: assetTypes || [],
      relationshipTypes: relationshipTypes || [],
    },
  });
}

/**
 * Create relationship
 */
export async function createRelationship(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof RelationshipCreateSchema.parse>,
): Promise<NextResponse> {
  const {
    sourceId,
    sourceType,
    sourceName,
    targetId,
    targetType,
    targetName,
    relationshipType,
    metadata,
  } = body;

  if (!isRelationshipType(relationshipType)) {
    throw new ValidationError(`Invalid relationship type: ${relationshipType}`, {
      field: "relationshipType",
    });
  }

  const relationship = await addRelationship(
    sourceId,
    sourceType,
    sourceName,
    targetId,
    targetType,
    targetName,
    relationshipType,
    metadata,
  );

  if (!relationship) {
    throw new ValidationError("Failed to create relationship", {
      context: { sourceType, targetType, relationshipType },
    });
  }

  log.info("Relationship created", {
    id: relationship.id,
    type: relationship.relationshipType,
  });

  return NextResponse.json({ success: true, relationship });
}

/**
 * Delete relationship
 */
export async function deleteRelationship(
  request: NextRequest,
): Promise<NextResponse> {
  const query = parseQuery(request);
  const queryResult = RelationshipDeleteSchema.safeParse({
    id: getQueryParam(query, "id") ?? "",
  });

  if (!queryResult.success) {
    throw new ValidationError("Missing relationship ID", {
      validationDetails: queryResult.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const { id: relationshipId } = queryResult.data;

  const removed = await removeRelationship(relationshipId);

  if (!removed) {
    throw new ValidationError(`Relationship not found: ${relationshipId}`, {
      field: "id",
      context: { id: relationshipId },
    });
  }

  log.info("Relationship removed", { id: relationshipId });

  return NextResponse.json({ success: true, removed: relationshipId });
}

/**
 * Search relationships
 */
export async function searchRelationships(
  request: NextRequest,
): Promise<NextResponse> {
  const query = parseQuery(request);
  const queryResult = RelationshipSearchSchema.safeParse({
    q: getQueryParam(query, "q") ?? undefined,
    limit: getQueryParam(query, "limit") ?? "20",
  });

  if (!queryResult.success) {
    throw new ValidationError("Invalid search parameters", {
      validationDetails: queryResult.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const { q: searchQuery, limit } = queryResult.data;

  if (!searchQuery || searchQuery.length < 2) {
    return NextResponse.json({ success: true, assets: [] });
  }

  const {
    getAllItems,
    getAllNpcs,
    getAllResources,
    getAllAreas,
    loadAllManifests,
  } = await import("@/lib/game/manifests");

  await loadAllManifests();

  const [items, npcs, resources, areas] = await Promise.all([
    getAllItems(),
    getAllNpcs(),
    getAllResources(),
    getAllAreas(),
  ]);

  const queryLower = searchQuery.toLowerCase();
  const results: Array<{ id: string; name: string; category: AssetCategory }> = [];

  for (const item of items) {
    if (item.name?.toLowerCase().includes(queryLower) || item.id.toLowerCase().includes(queryLower)) {
      results.push({ id: item.id, name: item.name || item.id, category: "item" });
    }
  }

  for (const npc of npcs) {
    if (npc.name?.toLowerCase().includes(queryLower) || npc.id.toLowerCase().includes(queryLower)) {
      results.push({ id: npc.id, name: npc.name || npc.id, category: "npc" });
    }
  }

  for (const resource of resources) {
    if (resource.name?.toLowerCase().includes(queryLower) || resource.id.toLowerCase().includes(queryLower)) {
      results.push({ id: resource.id, name: resource.name || resource.id, category: "resource" });
    }
  }

  for (const area of areas) {
    if (area.name?.toLowerCase().includes(queryLower) || area.id.toLowerCase().includes(queryLower)) {
      results.push({ id: area.id, name: area.name || area.id, category: "environment" as AssetCategory });
    }
  }

  const limitNum = typeof limit === "string" ? parseInt(limit, 10) : limit || 20;
  const limited = results.slice(0, limitNum);

  return NextResponse.json({
    success: true,
    query: searchQuery,
    assets: limited,
    total: results.length,
    returned: limited.length,
  });
}

/**
 * Relationships API routes
 */
export const relationshipsRoutes = {
  GET: {
    list: createGetRoute(getRelationshipsHandler),
    search: createGetRoute(searchRelationships),
  },
  POST: {
    create: createPostRoute(
      RelationshipCreateSchema,
      createRelationship as ValidatedHandler<
        ReturnType<typeof RelationshipCreateSchema.parse>
      >,
    ),
  },
  DELETE: {
    byId: createGetRoute(deleteRelationship),
  },
};
