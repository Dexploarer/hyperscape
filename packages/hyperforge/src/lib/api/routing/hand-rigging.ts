/**
 * Hand Rigging API Router
 * 
 * Handles hand rigging operations for 3D models
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { createPostRoute } from "./base";
import { GenerationError, HandRiggingSchema } from "@/lib/api";
import type { ValidatedHandler } from "./types";
import { z } from "zod";

const log = logger.child("API:routing:hand-rigging");

/**
 * Simple hand rigging - adds hand bones to GLB model
 */
export async function simpleHandRigging(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof HandRiggingSchema.parse>,
): Promise<NextResponse> {
  // Import polyfills before Three.js
  await import("@/lib/server/three-polyfills");

  const { SimpleHandRiggingService } = await import(
    "@/services/hand-rigging/SimpleHandRiggingService"
  );

  const { glbData, options } = body;
  const riggingOptions = options ?? {};

  const { DEFAULT_CONTENT_TYPES } = await import("@/lib/utils");
  const glbBuffer = Buffer.from(glbData, "base64");
  const glbBlob = new Blob([glbBuffer], { type: DEFAULT_CONTENT_TYPES.model });
  const glbBlobUrl = URL.createObjectURL(glbBlob);

  try {
    const handRiggingService = new SimpleHandRiggingService();
    const result = await handRiggingService.rigHands(glbBlobUrl, riggingOptions);

    if (!result.success || !result.riggedModel) {
      throw new GenerationError(result.error || "Hand rigging failed", {
        context: { options: riggingOptions },
      });
    }

    const riggedBase64 = Buffer.from(result.riggedModel).toString("base64");

    log.info("Hand rigging completed", { options: riggingOptions });

    return NextResponse.json({
      success: true,
      glbData: riggedBase64,
      message: "Hand rigging completed successfully",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Hand rigging failed", { error: errorMessage });

    throw new GenerationError(`Hand rigging failed: ${errorMessage}`, {
      context: { options: riggingOptions },
      cause: error instanceof Error ? error : undefined,
    });
  } finally {
    URL.revokeObjectURL(glbBlobUrl);
  }
}

/**
 * Hand Rigging API routes
 */
export const handRiggingRoutes = {
  POST: {
    simple: createPostRoute(
      HandRiggingSchema as z.ZodType<ReturnType<typeof HandRiggingSchema.parse>, z.ZodTypeDef, unknown>,
      simpleHandRigging as ValidatedHandler<
        ReturnType<typeof HandRiggingSchema.parse>
      >,
    ),
  },
};
