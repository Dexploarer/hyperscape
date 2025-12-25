/**
 * Variants API Router
 * 
 * Handles variant creation operations
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createGetRoute,
  createPostRoute,
} from "./base";
import {
  ValidationError,
  StorageError,
  VariantRequestSchema,
} from "@/lib/api";
import type { ValidatedHandler } from "./types";

/**
 * Create or list variants
 */
export async function handleVariants(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof VariantRequestSchema.parse>,
): Promise<NextResponse> {
  const { createRetextureTask } = await import("@/lib/meshy/client");
  const { pollTaskStatus } = await import("@/lib/meshy/poll-task");
  const { storageService } = await import("@/lib/storage");
  const { downloadFile } = await import("@/lib/storage/asset-storage");
  const { getAllAssets } = await import("@/lib/assets/registry");

  const data = body;

  if (data.action === "create") {
    const { baseModelId, baseModelUrl, variant, artStyle } = data;

    const variantBaseName = variant.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const variantId = `${variantBaseName}_${Date.now().toString(36).slice(-4)}`;

    const taskId = await createRetextureTask({
      model_url: baseModelUrl,
      text_style_prompt: variant.prompt,
      art_style: artStyle || "realistic",
    });

    const result = await pollTaskStatus(taskId, { timeoutMs: 300000 });

    if (result.status !== "SUCCEEDED" || !result.modelUrl) {
      throw new ValidationError("Variant creation failed", {
        context: { taskId, status: result.status },
      });
    }

    const modelBuffer = await downloadFile(result.modelUrl);
    const uploadResult = await storageService.uploadModel(modelBuffer, {
      assetId: variantId,
      format: "glb",
      metadata: {
        name: variant.name,
        type: "item",
        source: "FORGE",
        parentAssetId: baseModelId,
      },
    });

    if (!uploadResult.success) {
      throw new StorageError(uploadResult.error || "Failed to upload variant", {
        operation: "write",
        storageType: uploadResult.backend,
        context: { variantId },
      });
    }

    return NextResponse.json({
      success: true,
      variantId,
      modelUrl: result.modelUrl,
    });
  }

  if (data.action === "list") {
    const assets = await getAllAssets();
    const variants = assets.filter((a) => a.metadata?.parentAssetId === data.baseModelId);

    return NextResponse.json({
      success: true,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        variant: v.metadata?.variant,
      })),
    });
  }

  throw new ValidationError(`Unknown variant action: ${data.action}`, {
    field: "action",
  });
}

/**
 * Variants API routes
 */
export const variantsRoutes = {
  GET: {
    list: createGetRoute(async (request: NextRequest) => {
      const { getAllAssets } = await import("@/lib/assets/registry");
      const url = new URL(request.url);
      const baseModelId = url.searchParams.get("baseModelId");

      if (!baseModelId) {
        throw new ValidationError("baseModelId query parameter required", {
          field: "baseModelId",
        });
      }

      const assets = await getAllAssets();
      const variants = assets.filter((a) => a.metadata?.parentAssetId === baseModelId);

      return NextResponse.json({
        success: true,
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          variant: v.metadata?.variant,
        })),
      });
    }),
  },
  POST: {
    create: createPostRoute(
      VariantRequestSchema,
      handleVariants as ValidatedHandler<
        ReturnType<typeof VariantRequestSchema.parse>
      >,
    ),
  },
};
