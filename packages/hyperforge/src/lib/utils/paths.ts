/**
 * Path Utilities
 * Unified path construction for assets and directories
 */

import path from "path";

/**
 * Get the base assets directory
 * Uses HYPERFORGE_ASSETS_DIR env var or defaults to process.cwd()/assets
 */
export function getAssetsBaseDir(): string {
  return process.env.HYPERFORGE_ASSETS_DIR || path.join(process.cwd(), "assets");
}

/**
 * Get path to a specific asset directory
 */
export function getAssetDir(assetId: string): string {
  return path.join(getAssetsBaseDir(), assetId);
}

/**
 * Get path to images directory
 */
export function getImagesDir(): string {
  return path.join(getAssetsBaseDir(), "images");
}

/**
 * Get path to audio directory
 */
export function getAudioDir(): string {
  return path.join(getAssetsBaseDir(), "audio");
}

/**
 * Get path to uploads directory
 */
export function getUploadsDir(): string {
  return path.join(getAssetsBaseDir(), "uploads");
}

/**
 * Get path to content directory
 */
export function getContentDir(): string {
  return path.join(getAssetsBaseDir(), "content");
}

/**
 * Get path to server world manifests directory
 * Used for game server integration
 */
export function getServerManifestsDir(): string {
  return path.resolve(process.cwd(), "..", "server", "world", "assets", "manifests");
}

/**
 * Get path to server models directory
 * Used for game server integration
 */
export function getServerModelsDir(): string {
  return path.resolve(process.cwd(), "..", "server", "world", "assets", "models");
}

/**
 * Get path to server avatars directory
 * Used for VRM avatar loading in development
 */
export function getServerAvatarsDir(): string {
  return path.resolve(process.cwd(), "..", "server", "world", "assets", "avatars");
}

/**
 * Get path to server emotes directory
 * Used for emote animation loading in development
 */
export function getServerEmotesDir(): string {
  return path.resolve(process.cwd(), "..", "server", "world", "assets", "emotes");
}

/**
 * Get path to public data directory
 * Used for storing structures, towns, and other public JSON data
 */
export function getPublicDataDir(): string {
  return path.join(process.cwd(), "public", "data");
}
