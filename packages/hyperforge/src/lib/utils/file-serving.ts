/**
 * File Serving Utilities
 * Common utilities for serving files with proper headers
 */

import { NextResponse } from "next/server";
import { getContentTypeFromExtension, getModelContentType } from "./content-types";

/**
 * Standard cache headers for immutable assets
 */
export const IMMUTABLE_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
} as const;

/**
 * Create a file serving response with proper headers
 */
export function createFileResponse(
  buffer: Buffer,
  filename: string,
  options?: {
    contentType?: string;
    disposition?: "inline" | "attachment";
    cacheControl?: string;
  },
): NextResponse {
  const contentType =
    options?.contentType || getContentTypeFromExtension(filename);

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": buffer.length.toString(),
  };

  // Add cache control
  if (options?.cacheControl) {
    headers["Cache-Control"] = options.cacheControl;
  } else {
    headers["Cache-Control"] = IMMUTABLE_CACHE_HEADERS["Cache-Control"];
  }

  // Add content disposition if specified
  if (options?.disposition) {
    headers["Content-Disposition"] = `${options.disposition}; filename="${filename}"`;
  }

  return new NextResponse(buffer as unknown as BodyInit, { headers });
}

/**
 * Create a model file response
 */
export function createModelResponse(
  buffer: Buffer,
  assetId: string,
  format: "glb" | "vrm" | "gltf",
  disposition: "inline" | "attachment" = "inline",
): NextResponse {
  const contentType = getModelContentType(format);
  const filename = `${assetId}.${format}`;

  return createFileResponse(buffer, filename, {
    contentType,
    disposition,
  });
}
