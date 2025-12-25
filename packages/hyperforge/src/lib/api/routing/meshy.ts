/**
 * Meshy API Router
 *
 * Handles Meshy AI 3D generation operations:
 * - Image-to-3D conversion
 * - Text-to-3D preview and refine
 * - Task status checks
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import {
  createPostRoute,
} from "./base";
import {
  ValidationError,
  MeshyRequestSchema,
} from "@/lib/api";
import type { ValidatedHandler } from "./types";
import {
  createImageTo3DTask,
  createTextTo3DPreviewTask,
  createTextTo3DRefineTask,
  getTaskStatus,
} from "@/lib/meshy/client";
import type { MeshyAIModel, MeshyArtStyle, MeshyPoseMode } from "@/lib/meshy/types";

/**
 * Handle Meshy API requests
 */
async function handleMeshyRequest(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof MeshyRequestSchema.parse>,
): Promise<NextResponse> {
  const data = body;

  if (data.action === "image-to-3d") {
    const task = await createImageTo3DTask({
      image_url: data.imageUrl,
      enable_pbr: data.enablePBR,
      ai_model: data.aiModel as MeshyAIModel | undefined,
      topology: data.topology,
      target_polycount: data.targetPolycount,
      texture_resolution: data.textureResolution,
    });

    return NextResponse.json(task);
  }

  if (data.action === "text-to-3d-preview") {
    // Stage 1: Create preview task (generates mesh without texture)
    const taskId = await createTextTo3DPreviewTask({
      prompt: data.prompt,
      ai_model: (data.aiModel ?? "latest") as MeshyAIModel,
      topology: data.topology ?? "triangle",
      target_polycount: data.targetPolycount ?? 2000, // Game-optimized default
      art_style: (data.artStyle ?? "realistic") as MeshyArtStyle,
      symmetry_mode: data.symmetryMode ?? "auto",
      pose_mode: (data.poseMode ?? "") as MeshyPoseMode,
      seed: data.seed,
    });

    return NextResponse.json({ taskId, stage: "preview" });
  }

  if (data.action === "text-to-3d-refine") {
    // Stage 2: Create refine task (adds texture to preview mesh)
    const taskId = await createTextTo3DRefineTask(data.previewTaskId, {
      prompt: "", // Not used in refine stage
      enable_pbr: data.enablePBR ?? true,
      texture_resolution: data.textureResolution ?? 2048,
      texture_prompt: data.texturePrompt,
      texture_image_url: data.textureImageUrl,
    });

    return NextResponse.json({ taskId, stage: "refine" });
  }

  if (data.action === "status") {
    const task = await getTaskStatus(data.taskId);
    return NextResponse.json(task);
  }

  // This should never be reached due to discriminated union validation
  const _exhaustive: never = data;
  throw new ValidationError(`Invalid action: ${(_exhaustive as { action: string }).action}`, {
    field: "action",
  });
}

/**
 * Meshy API routes
 */
export const meshyRoutes = {
  POST: {
    request: createPostRoute(
      MeshyRequestSchema,
      handleMeshyRequest as ValidatedHandler<
        ReturnType<typeof MeshyRequestSchema.parse>
      >,
    ),
  },
};
