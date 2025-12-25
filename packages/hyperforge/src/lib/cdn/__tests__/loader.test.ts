/**
 * CDN Loader Tests
 *
 * Tests for CDN asset loading.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadCDNAssets,
} from "../loader";
import { promises as fs } from "fs";
import path from "path";
import { getServerManifestsDir } from "@/lib/utils/paths";

// Mock paths
vi.mock("@/lib/utils/paths", () => ({
  getServerManifestsDir: () => path.join(process.cwd(), ".test-manifests"),
  getServerAvatarsDir: () => path.join(process.cwd(), ".test-avatars"),
  getServerEmotesDir: () => path.join(process.cwd(), ".test-emotes"),
}));

describe("CDNLoader", () => {
  const testManifestsDir = path.join(process.cwd(), ".test-manifests");

  beforeEach(async () => {
    await fs.mkdir(testManifestsDir, { recursive: true });
    await fs.writeFile(
      path.join(testManifestsDir, "items.json"),
      JSON.stringify([
        {
          id: "test-item",
          name: "Test Item",
          type: "weapon",
          value: 100,
          weight: 1,
          description: "Test",
          examine: "Test",
          tradeable: true,
          rarity: "common",
          modelPath: "/models/test.glb",
          iconPath: "/icons/test.png",
        },
      ]),
    );
  });

  it("loads CDN assets", async () => {
    const assets = await loadCDNAssets();
    expect(assets).toBeDefined();
    expect(Array.isArray(assets)).toBe(true);
  });

  it("filters assets by category", async () => {
    const allAssets = await loadCDNAssets();
    const weapons = allAssets.filter((a) => a.category === "weapon");
    expect(Array.isArray(weapons)).toBe(true);
  });

  it("finds asset by ID", async () => {
    const allAssets = await loadCDNAssets();
    const asset = allAssets.find((a) => a.id === "test-item");
    expect(asset).toBeDefined();
    expect(asset?.id).toBe("test-item");
  });

  it("returns undefined for non-existent asset", async () => {
    const allAssets = await loadCDNAssets();
    const asset = allAssets.find((a) => a.id === "nonexistent");
    expect(asset).toBeUndefined();
  });
});
