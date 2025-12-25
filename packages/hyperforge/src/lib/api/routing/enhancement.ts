/**
 * Enhancement API Router
 * 
 * Handles asset enhancement operations (retexture, regenerate, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { createPostRoute } from "./base";
import { ValidationError, StorageError, EnhancementRequestSchema } from "@/lib/api";
import type { ValidatedHandler } from "./types";
import type { AssetCategory } from "@/types/core";
import type { ZodSchema } from "zod";

const log = logger.child("API:routing:enhancement");

/**
 * Enhance an asset (retexture, regenerate, modify metadata)
 */
export async function enhanceAsset(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof EnhancementRequestSchema.parse>,
): Promise<NextResponse> {
  const { getAssetById, updateAssetPaths } = await import(
    "@/lib/db/asset-queries"
  );
  const { createRetextureTask } = await import("@/lib/meshy/client");
  const { pollTaskStatus } = await import("@/lib/meshy/poll-task");
  const { storageService } = await import("@/lib/storage");
  const { downloadFile } = await import("@/lib/storage/asset-storage");

  const data = body;

  log.info({ action: data.action, assetId: data.assetId }, "Enhancement request received");

  switch (data.action) {
    case "retexture": {
      const { assetId, styleType, textPrompt, imageUrl, artStyle } = data;

      if (styleType === "text" && !textPrompt) {
        throw new ValidationError("textPrompt is required for 'text' style", {
          field: "textPrompt",
        });
      }
      if (styleType === "image" && !imageUrl) {
        throw new ValidationError("imageUrl is required for 'image' style", {
          field: "imageUrl",
        });
      }

      const asset = await getAssetById(assetId);
      if (!asset) {
        throw new ValidationError(`Asset not found: ${assetId}`, { field: "assetId" });
      }

      const modelUrl = asset.cdnUrl || asset.localPath;
      if (!modelUrl) {
        throw new ValidationError("Asset has no model URL", { field: "assetId" });
      }

      const taskId = await createRetextureTask({
        model_url: modelUrl,
        text_style_prompt: styleType === "text" ? textPrompt : undefined,
        image_style_url: styleType === "image" ? imageUrl : undefined,
        art_style: artStyle === "realistic" ? "realistic" : artStyle === "sculpture" ? "sculpture" : "realistic",
      });

      const result = await pollTaskStatus(taskId, { timeoutMs: 300000 });

      if (result.status !== "SUCCEEDED" || !result.modelUrl) {
        throw new ValidationError("Retexture failed", {
          context: { taskId, status: result.status },
        });
      }

      const newAssetId = `${assetId}_retextured_${Date.now()}`;
      const glbBuffer = await downloadFile(result.modelUrl);
      const thumbnailBuffer = result.thumbnailUrl
        ? await downloadFile(result.thumbnailUrl)
        : undefined;

      const uploadResult = await storageService.uploadModel(glbBuffer, {
        assetId: newAssetId,
        format: "glb",
        thumbnailBuffer,
        metadata: {
          ...asset,
          id: newAssetId,
          name: `${asset.name} (Retextured)`,
          source: "FORGE",
          workflow: "retexture",
          parentAssetId: assetId,
        },
      });

      if (!uploadResult.success) {
        throw new StorageError(uploadResult.error || "Failed to upload retextured model", {
          operation: "write",
          storageType: uploadResult.backend,
          context: { assetId: newAssetId },
        });
      }

      return NextResponse.json({
        success: true,
        assetId: newAssetId,
        modelUrl: result.modelUrl,
        thumbnailUrl: result.thumbnailUrl,
      });
    }

    case "regenerate": {
      const { assetId, prompt, variationStrength = 50 } = data;
      const { generate3DModel } = await import("@/lib/generation/generation-service");
      const { generateAssetId } = await import("@/lib/utils/asset-naming");

      const asset = await getAssetById(assetId);
      if (!asset) {
        // For CDN assets, use provided metadata
        if (data.assetName && data.assetCategory) {
          const assetDescription = data.assetDescription || data.assetName;
          const basePrompt = prompt || assetDescription;
          
          // Adjust prompt based on variation strength
          const variationPrompt = variationStrength > 50
            ? `${basePrompt}, create a new variation with ${variationStrength}% variation`
            : basePrompt;

          const newAssetId = generateAssetId(data.assetName, {
            category: data.assetCategory,
            type: data.assetType || "object",
          });

          const result = await generate3DModel({
            prompt: variationPrompt,
            category: (data.assetCategory || "item") as AssetCategory,
            pipeline: "text-to-3d",
            quality: "medium",
            metadata: {
              id: newAssetId,
              name: data.assetName,
              description: assetDescription,
              type: data.assetType || "object",
              category: data.assetCategory || "item",
            },
          });

          return NextResponse.json({
            success: true,
            assetId: newAssetId,
            name: data.assetName,
            modelUrl: result.modelUrl,
            thumbnailUrl: result.thumbnailUrl,
          });
        }

        throw new ValidationError(`Asset not found: ${assetId}`, { field: "assetId" });
      }

      // Use asset metadata to regenerate
      const assetDescription = asset.description || asset.name || "";
      const basePrompt = prompt || assetDescription;
      
      // Adjust prompt based on variation strength
      const variationPrompt = variationStrength > 50
        ? `${basePrompt}, create a new variation with ${variationStrength}% variation`
        : basePrompt;

      const newAssetId = generateAssetId(asset.name || assetId, {
        category: asset.category || "item",
        type: asset.type || "object",
      });

      const result = await generate3DModel({
        prompt: variationPrompt,
        category: (asset.category || "item") as AssetCategory,
        pipeline: "text-to-3d",
        quality: "medium",
        metadata: {
          id: newAssetId,
          name: asset.name || assetId,
          description: assetDescription,
          type: asset.type || "object",
          category: asset.category || "item",
        },
      });

      return NextResponse.json({
        success: true,
        assetId: newAssetId,
        name: asset.name || assetId,
        modelUrl: result.modelUrl,
        thumbnailUrl: result.thumbnailUrl,
      });
    }

    case "modify_metadata": {
      const { assetId, name, description, tags, metadata } = data;
      const { updateAsset } = await import("@/lib/db/asset-queries");

      const asset = await getAssetById(assetId);
      if (!asset) {
        throw new ValidationError(`Asset not found: ${assetId}`, { field: "assetId" });
      }

      const updateData: {
        name?: string;
        description?: string;
        tags?: string[];
        generationParams?: Record<string, unknown>;
      } = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = tags;
      if (metadata !== undefined) updateData.generationParams = metadata;

      await updateAsset(assetId, updateData);

      return NextResponse.json({
        success: true,
        assetId,
        message: "Metadata updated",
      });
    }

    // TypeScript knows this is unreachable due to discriminated union,
    // but we include it for runtime safety
    default: {
      const _exhaustive: never = data;
      throw new ValidationError(`Unknown enhancement action: ${(_exhaustive as { action: string }).action}`, {
        field: "action",
      });
    }
  }
}

/**
 * Enhancement API routes
 */
export const enhancementRoutes = {
  POST: {
    enhance: createPostRoute(
      EnhancementRequestSchema as unknown as ZodSchema<ReturnType<typeof EnhancementRequestSchema.parse>>,
      enhanceAsset as ValidatedHandler<
        ReturnType<typeof EnhancementRequestSchema.parse>
      >,
    ),
  },
};
