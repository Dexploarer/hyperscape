/**
 * CDN URL Resolver Tests
 *
 * Tests for CDN URL resolution.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  getAssetModelUrl,
  getAssetThumbnailUrl,
} from "../url-resolver";
import type { CDNAsset } from "../types";

describe("CDNUrlResolver", () => {
  it("resolves CDN asset model URL", () => {
    const asset: CDNAsset = {
      id: "test-item",
      name: "Test Item",
      category: "weapon",
      source: "CDN",
      modelPath: "asset://models/sword.glb",
      rarity: "common",
    };

    const url = getAssetModelUrl(asset);
    expect(url).toContain("asset://");
  });

  it("resolves LOCAL asset model URL", () => {
    const asset = {
      id: "local-item",
      name: "Local Item",
      category: "weapon",
      source: "LOCAL" as const,
      modelPath: "/models/local.glb",
      rarity: "common" as const,
    };

    const url = getAssetModelUrl(asset);
    expect(url).toContain("/api/assets/");
  });

  it("resolves FORGE asset model URL", () => {
    const asset = {
      id: "forge-item",
      name: "Forge Item",
      category: "weapon",
      source: "FORGE" as const,
      modelPath: "/models/forge.glb",
      rarity: "common" as const,
    };

    const url = getAssetModelUrl(asset);
    expect(url).toContain("/api/assets/");
  });

  it("handles full URLs", () => {
    const asset: CDNAsset = {
      id: "test",
      name: "Test",
      category: "weapon",
      source: "CDN",
      modelPath: "https://cdn.example.com/model.glb",
      rarity: "common",
    };

    const url = getAssetModelUrl(asset);
    expect(url).toBe("https://cdn.example.com/model.glb");
  });

  it("resolves thumbnail URL", () => {
    const asset: CDNAsset = {
      id: "test-item",
      name: "Test Item",
      category: "weapon",
      source: "CDN",
      modelPath: "/models/test.glb",
      thumbnailPath: "asset://icons/test.png",
      rarity: "common",
    };

    const url = getAssetThumbnailUrl(asset);
    expect(url).toBeDefined();
    expect(url).toContain("asset://");
  });

  it("returns undefined for missing thumbnail", () => {
    const asset: CDNAsset = {
      id: "test-item",
      name: "Test Item",
      category: "weapon",
      source: "CDN",
      modelPath: "/models/test.glb",
      rarity: "common",
    };

    const url = getAssetThumbnailUrl(asset);
    expect(url).toBeUndefined();
  });
});
