/**
 * Emotes API Router
 * 
 * Handles VRM emote operations
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { createGetRoute } from "./base";
import { StorageError } from "@/lib/api";

const log = logger.child("API:routing:emotes");

/**
 * List available emotes
 */
export async function listEmotes(): Promise<NextResponse> {
  const { loadVRMEmotes } = await import("@/lib/cdn/loader");

  try {
    const emotes = await loadVRMEmotes();
    return NextResponse.json(emotes);
  } catch (error) {
    log.error({ error }, "Failed to load emotes from CDN");
    throw new StorageError("Failed to load emotes", {
      storageType: "local",
      operation: "read",
      cause: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * Emotes API routes
 */
export const emotesRoutes = {
  GET: {
    list: createGetRoute(listEmotes),
  },
};
