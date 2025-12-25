/**
 * Bulk API Router
 * 
 * Handles bulk operations (variants, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { createPostRoute } from "./base";
import { BulkVariantsRequestSchema, ValidationError } from "@/lib/api";
import type { ValidatedHandler } from "./types";
import type { ZodSchema } from "zod";

const log = logger.child("API:routing:bulk");

/**
 * Create bulk variants
 */
export async function createBulkVariants(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof BulkVariantsRequestSchema.parse>,
): Promise<NextResponse> {
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const {
    createMaterialVariants,
  } = await import("@/lib/bulk/bulk-operations");

  const { baseAsset, materials } = body;

  if (!baseAsset) {
    throw new ValidationError("baseAsset is required for create_variants action", {
      field: "baseAsset",
    });
  }

  const { getServerManifestsDir } = await import("@/lib/utils");
  const MANIFESTS_DIR = getServerManifestsDir();

  const result = await createMaterialVariants(baseAsset, materials);

  // Update manifest with generated items
  if (result.items.length > 0) {
    const manifestPath = path.join(MANIFESTS_DIR, "items.json");
    const existing = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
    existing.push(...result.items);
    await fs.writeFile(manifestPath, JSON.stringify(existing, null, 2));
  }

  log.info("Created bulk variants", {
    itemsCreated: result.items.length,
    errors: result.errors.length,
  });

  return NextResponse.json({
    success: result.success,
    variants: result.items.map((v) => ({
      id: v.id,
      name: v.name,
      level: v.requirements?.level || 1,
      rarity: v.rarity,
      value: v.value,
    })),
    count: result.items.length,
    errors: result.errors,
    summary: result.summary,
  });
}

/**
 * Bulk API routes
 */
export const bulkRoutes = {
  POST: {
    variants: createPostRoute(
      BulkVariantsRequestSchema as unknown as ZodSchema<ReturnType<typeof BulkVariantsRequestSchema.parse>>,
      createBulkVariants as ValidatedHandler<
        ReturnType<typeof BulkVariantsRequestSchema.parse>
      >,
    ),
  },
};
