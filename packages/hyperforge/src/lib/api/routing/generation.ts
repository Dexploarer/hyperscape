/**
 * Generation Domain Routing Layer
 * 
 * Consolidated generation operations for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generate3DModel,
  generateBatch,
} from "@/lib/generation/generation-service";
import { generateConceptArt } from "@/lib/ai/concept-art-service";
import type { GenerationConfig } from "@/components/generation/GenerationFormRouter";
import { logger } from "@/lib/utils";
import { GenerationRequestSchema, AIGenerateRequestSchema } from "@/lib/api/schemas";
import { ValidationError, GenerationError } from "@/lib/api";
import {
  createPostRoute,
  createGetRoute,
  successResponse,
} from "./base";
import type { ValidatedHandler } from "./types";
import { getTaskStatus } from "@/lib/meshy/client";
import type { ZodSchema } from "zod";

const log = logger.child("API:routing:generation");

/**
 * Handle generation requests
 */
export async function handleGeneration(
  _request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof GenerationRequestSchema.parse>,
): Promise<NextResponse> {
  const { action } = body;

  // Generate concept art preview
  if (action === "generate-concept-art") {
    const { config } = body;

    const result = await generateConceptArt(config.prompt, {
      style:
        (config.style as
          | "realistic"
          | "stylized"
          | "pixel"
          | "painterly") || "stylized",
      viewAngle:
        (config.viewAngle as
          | "side"
          | "isometric"
          | "front"
          | "three-quarter") || "isometric",
      background: "simple",
      assetType: config.assetType || "item",
    });

    if (!result) {
      throw new GenerationError("Concept art generation failed", {
        stage: "concept-art",
        context: { prompt: config.prompt, style: config.style },
      });
    }

    return NextResponse.json({
      success: true,
      conceptArtUrl: result.imageUrl,
      previewUrl: result.dataUrl,
    });
  }

  // Generate 3D model
  if (action === "generate") {
    const { config, stream } = body;

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const result = await generate3DModel(
              config as GenerationConfig,
              (progress) => {
                const data = JSON.stringify({
                  type: "progress",
                  ...progress,
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              },
            );

            const finalData = JSON.stringify({
              type: "complete",
              result,
            });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            controller.close();
          } catch (error) {
            const errorMessage =
              error instanceof GenerationError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : "Generation failed";
            const errorData = JSON.stringify({
              type: "error",
              error: errorMessage,
              code:
                error instanceof GenerationError
                  ? error.code
                  : "GENERATION_ERROR",
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new NextResponse(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming
    const result = await generate3DModel(config as GenerationConfig);
    return NextResponse.json(result);
  }

  // Batch generation
  if (action === "batch") {
    const { config, count } = body;

    const results = await generateBatch(config as GenerationConfig, count);
    return successResponse({ results });
  }

  // Status check
  if (action === "status") {
    const { taskId } = body;

    log.debug({ taskId }, "Checking generation status");

    const task = await getTaskStatus(taskId);

    const statusResponse = {
      taskId,
      status: task.status,
      progress: task.progress || 0,
      createdAt: task.created_at,
      startedAt: task.started_at,
      finishedAt: task.finished_at,
      ...(task.status === "SUCCEEDED" && {
        result: {
          modelUrl: task.model_urls?.glb || task.model_url,
          thumbnailUrl: task.thumbnail_url,
          textureUrls: task.texture_urls,
        },
      }),
      ...(task.status === "FAILED" && {
        error: task.task_error?.message || "Generation failed",
      }),
    };

    return successResponse(statusResponse);
  }

  throw new ValidationError("Invalid action", {
    context: { action },
  });
}

/**
 * Handle AI generation (text/image)
 */
export async function handleAIGeneration(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof AIGenerateRequestSchema.parse>,
): Promise<NextResponse> {
  // AIGenerateRequestSchema is used in type annotation above
  const {
    generateTextWithProvider,
    generateImageWithProvider,
  } = await import("@/lib/ai/gateway");

  const { type, prompt, provider, options } = body;

  if (type === "text") {
    const text = await generateTextWithProvider(prompt, {
      model: provider,
      maxTokens: (options as { maxTokens?: number })?.maxTokens,
      temperature: (options as { temperature?: number })?.temperature,
      systemPrompt: (options as { systemPrompt?: string })?.systemPrompt,
    });
    return NextResponse.json({ success: true, text });
  }

  if (type === "image") {
    const imageOptions = options as {
      size?: "256x256" | "512x512" | "768x768" | "1024x1024" | "1792x1024" | "1024x1792" | "2048x2048";
      quality?: "standard" | "hd";
      style?: "vivid" | "natural";
    } | undefined;

    const imageUrl = await generateImageWithProvider(prompt, {
      model: provider,
      size: imageOptions?.size,
      quality: imageOptions?.quality,
      style: imageOptions?.style,
    });
    return NextResponse.json({ success: true, imageUrl });
  }

  throw new ValidationError("Invalid generation type. Use 'text' or 'image'.", {
    field: "type",
  });
}

/**
 * Export route handlers for generation domain
 */
export const generationRoutes = {
  POST: {
    generate: createPostRoute(
      GenerationRequestSchema,
      handleGeneration as ValidatedHandler<
        ReturnType<typeof GenerationRequestSchema.parse>
      >,
    ),
  },
};

/**
 * AI Generation routes (text/image via AI Gateway)
 */
export const aiRoutes = {
  GET: {
    info: createGetRoute(async (_request: NextRequest, _context: unknown) => {
      return NextResponse.json({
        name: "AI Generation API",
        description: "Generate text or images using AI providers via the AI Gateway",
        usage: {
          method: "POST",
          body: {
            type: "'text' | 'image'",
            prompt: "The generation prompt",
            provider: "Model identifier",
            options: "Generation options",
          },
        },
      });
    }),
  },
  POST: {
    generate: createPostRoute(
      AIGenerateRequestSchema as unknown as ZodSchema<ReturnType<typeof AIGenerateRequestSchema.parse>>,
      handleAIGeneration as ValidatedHandler<
        ReturnType<typeof AIGenerateRequestSchema.parse>
      >,
    ),
  },
};
