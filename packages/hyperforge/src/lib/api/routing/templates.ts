/**
 * Templates API Router
 * 
 * Handles template-based asset creation
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { createPostRoute } from "./base";
import { ValidationError, TemplateCreateSchema } from "@/lib/api";
import type { ValidatedHandler } from "./types";

const log = logger.child("API:routing:templates");

/**
 * Create assets from template
 */
export async function createFromTemplate(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof TemplateCreateSchema.parse>,
): Promise<NextResponse> {
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const {
    applyTierSetTemplate,
    applyMobPackTemplate,
    applyAssetBundleTemplate,
  } = await import("@/lib/templates/asset-templates");

  const { templateType, templateId, materials } = body;

  const { getServerManifestsDir } = await import("@/lib/utils");
  const MANIFESTS_DIR = getServerManifestsDir();

  let result;

  switch (templateType) {
    case "tier_set":
      if (!materials || materials.length === 0) {
        throw new ValidationError("Materials are required for tier_set templates", {
          field: "materials",
        });
      }
      result = applyTierSetTemplate(templateId, materials);
      break;
    case "mob_pack":
      result = applyMobPackTemplate(templateId);
      break;
    case "asset_bundle":
      result = applyAssetBundleTemplate(templateId);
      break;
    default:
      throw new ValidationError(`Unknown template type: ${templateType}`, {
        field: "templateType",
      });
  }

  // Collect asset IDs from generated items/mobs/npcs
  const createdAssetIds: string[] = [
    ...result.items.map((item) => item.id),
    ...result.mobs.map((mob) => mob.id),
    ...result.npcs.map((npc) => npc.id),
  ];

  // Update manifest files based on generated assets
  const manifestsUpdated: string[] = [];
  
  if (result.items.length > 0) {
    const manifestPath = path.join(MANIFESTS_DIR, "items.json");
    try {
      const existing = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
      existing.push(...result.items);
      await fs.writeFile(manifestPath, JSON.stringify(existing, null, 2));
      manifestsUpdated.push("items");
    } catch {
      // Manifest file doesn't exist, create it
      await fs.writeFile(manifestPath, JSON.stringify(result.items, null, 2));
      manifestsUpdated.push("items");
    }
  }

  if (result.mobs.length > 0) {
    const manifestPath = path.join(MANIFESTS_DIR, "npcs.json");
    try {
      const existing = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
      existing.push(...result.mobs);
      await fs.writeFile(manifestPath, JSON.stringify(existing, null, 2));
      manifestsUpdated.push("npcs");
    } catch {
      await fs.writeFile(manifestPath, JSON.stringify(result.mobs, null, 2));
      manifestsUpdated.push("npcs");
    }
  }

  if (result.npcs.length > 0) {
    const manifestPath = path.join(MANIFESTS_DIR, "npcs.json");
    try {
      const existing = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
      existing.push(...result.npcs);
      await fs.writeFile(manifestPath, JSON.stringify(existing, null, 2));
      if (!manifestsUpdated.includes("npcs")) {
        manifestsUpdated.push("npcs");
      }
    } catch {
      await fs.writeFile(manifestPath, JSON.stringify(result.npcs, null, 2));
      if (!manifestsUpdated.includes("npcs")) {
        manifestsUpdated.push("npcs");
      }
    }
  }

  log.info("Created assets from template", {
    templateType,
    assetCount: createdAssetIds.length,
    summary: result.summary,
  });

  return NextResponse.json({
    success: true,
    createdAssetIds,
    summary: result.summary,
    manifestsUpdated,
  });
}

/**
 * Templates API routes
 */
export const templatesRoutes = {
  POST: {
    create: createPostRoute(
      TemplateCreateSchema,
      createFromTemplate as ValidatedHandler<
        ReturnType<typeof TemplateCreateSchema.parse>
      >,
    ),
  },
};
