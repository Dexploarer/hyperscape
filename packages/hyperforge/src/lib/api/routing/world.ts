/**
 * World API Router
 * 
 * Handles world entity and configuration operations
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/utils";
import {
  createGetRoute,
  createPostRoute,
} from "./base";
import {
  ValidationError,
  StorageError,
  CreateEntitySchema,
  EntityPatchSchema,
  WorldAreasConfigSchema,
  WorldConfigPostSchema,
} from "@/lib/api";
import type { ValidatedHandler } from "./types";

const log = logger.child("API:routing:world");

/**
 * Get world entities
 */
export async function getEntities(_request: NextRequest): Promise<NextResponse> {
  const { getWorldEntities } = await import("@/lib/game/manifests");

  const GAME_SERVER_URL =
    process.env.HYPERSCAPE_SERVER_URL || "http://localhost:5555";

  try {
    const response = await fetch(`${GAME_SERVER_URL}/api/world/entities`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, entities: data.entities || [] });
    }
  } catch {
    // Fall back to manifest service
  }

  const entities = await getWorldEntities();
  return NextResponse.json({ success: true, entities });
}

/**
 * Create world entity
 */
export async function createEntity(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof CreateEntitySchema.parse>,
): Promise<NextResponse> {
  const GAME_SERVER_URL =
    process.env.HYPERSCAPE_SERVER_URL || "http://localhost:5555";

  try {
    const response = await fetch(`${GAME_SERVER_URL}/api/world/entities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, entity: data.entity });
    }
  } catch {
    // Fall back to local storage
  }

  const { promises: fs } = await import("fs");
  const path = await import("path");

  const SERVER_WORLD_DIR =
    process.env.HYPERSCAPE_WORLD_DIR ||
    path.resolve(process.cwd(), "..", "server", "world");
  const WORLD_CONFIG_PATH = path.join(SERVER_WORLD_DIR, "world.json");

  async function readWorldConfig() {
    try {
      const content = await fs.readFile(WORLD_CONFIG_PATH, "utf-8");
      return JSON.parse(content);
    } catch {
      return { entities: [] };
    }
  }

  async function writeWorldConfig(config: { entities: unknown[] }) {
    await fs.mkdir(SERVER_WORLD_DIR, { recursive: true });
    await fs.writeFile(WORLD_CONFIG_PATH, JSON.stringify(config, null, 2));
  }

  const config = await readWorldConfig();
  config.entities = config.entities || [];
  config.entities.push(body);

  await writeWorldConfig(config);

  return NextResponse.json({ success: true, entity: body });
}

/**
 * Get single entity by ID
 */
export async function getEntity(
  entityId: string,
): Promise<NextResponse> {
  const GAME_SERVER_URL =
    process.env.HYPERSCAPE_SERVER_URL || "http://localhost:5555";

  try {
    const response = await fetch(`${GAME_SERVER_URL}/api/world/entities/${entityId}`, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, entity: data.entity });
    }
  } catch {
    // Fall back to local
  }

  const { promises: fs } = await import("fs");
  const path = await import("path");

  const SERVER_WORLD_DIR =
    process.env.HYPERSCAPE_WORLD_DIR ||
    path.resolve(process.cwd(), "..", "server", "world");
  const WORLD_CONFIG_PATH = path.join(SERVER_WORLD_DIR, "world.json");

  try {
    const content = await fs.readFile(WORLD_CONFIG_PATH, "utf-8");
    const config = JSON.parse(content);
    const entity = config.entities?.find((e: { id: string }) => e.id === entityId);

    if (!entity) {
      throw new ValidationError(`Entity not found: ${entityId}`, { field: "id" });
    }

    return NextResponse.json({ success: true, entity });
  } catch {
    throw new StorageError(`Entity not found: ${entityId}`, {
      operation: "read",
      storageType: "local",
      context: { entityId },
    });
  }
}

/**
 * Update entity
 */
export async function updateEntity(
  entityId: string,
  updates: ReturnType<typeof EntityPatchSchema.parse>,
): Promise<NextResponse> {
  const GAME_SERVER_URL =
    process.env.HYPERSCAPE_SERVER_URL || "http://localhost:5555";

  try {
    const response = await fetch(`${GAME_SERVER_URL}/api/world/entities/${entityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, entity: data.entity });
    }
  } catch (error) {
    log.warn("Game server unavailable for entity update", { entityId, error });
  }

  throw new ValidationError("Game server is required for entity updates. Ensure HYPERSCAPE_SERVER_URL is configured and the server is running.", {
    field: "entityId",
    context: { entityId, gameServerUrl: GAME_SERVER_URL },
  });
}

/**
 * Delete entity
 */
export async function deleteEntity(entityId: string): Promise<NextResponse> {
  const GAME_SERVER_URL =
    process.env.HYPERSCAPE_SERVER_URL || "http://localhost:5555";

  try {
    const response = await fetch(`${GAME_SERVER_URL}/api/world/entities/${entityId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    log.warn("Game server unavailable for entity deletion", { entityId, error });
  }

  throw new ValidationError("Game server is required for entity deletion. Ensure HYPERSCAPE_SERVER_URL is configured and the server is running.", {
    field: "entityId",
    context: { entityId, gameServerUrl: GAME_SERVER_URL },
  });
}

/**
 * Get world config
 */
export async function getWorldConfig(): Promise<NextResponse> {
  const { promises: fs } = await import("fs");
  const path = await import("path");

  const { getServerManifestsDir } = await import("@/lib/utils");
  const MANIFESTS_DIR = getServerManifestsDir();
  const WORLD_AREAS_PATH = path.join(MANIFESTS_DIR, "world-areas.json");

  try {
    const content = await fs.readFile(WORLD_AREAS_PATH, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({
      starterTowns: {},
      level1Areas: {},
      level2Areas: {},
      level3Areas: {},
    });
  }
}

/**
 * Update world config
 */
export async function updateWorldConfig(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof WorldAreasConfigSchema.parse> | ReturnType<typeof WorldConfigPostSchema.parse>,
): Promise<NextResponse> {
  const { promises: fs } = await import("fs");
  const path = await import("path");

  const { getServerManifestsDir } = await import("@/lib/utils");
  const MANIFESTS_DIR = getServerManifestsDir();
  const WORLD_AREAS_PATH = path.join(MANIFESTS_DIR, "world-areas.json");

  await fs.mkdir(MANIFESTS_DIR, { recursive: true });
  await fs.writeFile(WORLD_AREAS_PATH, JSON.stringify(body, null, 2));

  return NextResponse.json({ success: true, message: "World config updated" });
}

/**
 * World API routes
 */
export const worldRoutes = {
  GET: {
    entities: createGetRoute(getEntities),
    entity: (entityId: string) => createGetRoute(async () => getEntity(entityId)),
    config: createGetRoute(getWorldConfig),
  },
  POST: {
    entities: createPostRoute(
      CreateEntitySchema,
      createEntity as ValidatedHandler<ReturnType<typeof CreateEntitySchema.parse>>,
    ),
    config: createPostRoute(
      WorldConfigPostSchema as z.ZodType<ReturnType<typeof WorldConfigPostSchema.parse>, z.ZodTypeDef, unknown>,
      updateWorldConfig as ValidatedHandler<ReturnType<typeof WorldConfigPostSchema.parse>>,
    ),
  },
  PATCH: {
    entity: (entityId: string) =>
      createPostRoute(
        EntityPatchSchema,
        async (_req, _ctx, body) => updateEntity(entityId, body),
      ),
  },
  DELETE: {
    entity: (entityId: string) =>
      createGetRoute(async () => deleteEntity(entityId)),
  },
};
