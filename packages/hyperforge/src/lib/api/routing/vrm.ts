/**
 * VRM API Router
 * 
 * Handles VRM conversion operations
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { createPostRoute } from "./base";
import { ValidationError, NetworkError, VRMConvertSchema } from "@/lib/api";
import type { ValidatedHandler } from "./types";

const log = logger.child("API:routing:vrm");

/**
 * Convert GLB to VRM
 */
export async function convertVRM(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof VRMConvertSchema.parse>,
): Promise<NextResponse> {
  const { convertGLBToVRMPreservingTextures } = await import(
    "@/services/vrm/VRMConverter"
  );

  const { modelUrl, glbData, avatarName, author } = body;

  let glbArrayBuffer: ArrayBuffer;

  if (glbData) {
    const glbBuffer = Buffer.from(glbData, "base64");
    glbArrayBuffer = glbBuffer.buffer;
  } else if (modelUrl) {
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new NetworkError(`Failed to download model: ${response.statusText}`, {
        statusCode: response.status,
        endpoint: modelUrl,
      });
    }
    glbArrayBuffer = await response.arrayBuffer();
  } else {
    throw new ValidationError("Either modelUrl or glbData is required", {
      field: "modelUrl",
    });
  }

  log.info("Converting GLB to VRM", { avatarName, author });

  const result = await convertGLBToVRMPreservingTextures(
    glbArrayBuffer,
    {
      avatarName: avatarName || "Avatar",
      author: author || "HyperForge",
    },
  );

  const vrmBase64 = Buffer.from(result.vrmData).toString("base64");

  return NextResponse.json({
    success: true,
    vrmData: vrmBase64,
    message: "VRM conversion completed",
  });
}

/**
 * VRM API routes
 */
export const vrmRoutes = {
  POST: {
    convert: createPostRoute(
      VRMConvertSchema,
      convertVRM as ValidatedHandler<ReturnType<typeof VRMConvertSchema.parse>>,
    ),
  },
};
