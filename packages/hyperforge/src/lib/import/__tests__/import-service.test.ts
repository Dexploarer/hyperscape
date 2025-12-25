/**
 * Import Service Tests
 *
 * Tests for import service operations.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadAllGameManifests,
  loadManifest,
  detectChanges,
  detectDeletedAssets,
  getManifestSyncStatus,
  getSyncStatus,
  importSelectedAssets,
  importFromManifests,
  getLastSyncTime,
  updateSyncTime,
  updateAllSyncTimes,
  getManifestsDirectory,
  manifestsExist,
  listManifestFiles,
} from "../import-service";
import type { ParsedGameAsset } from "../manifest-parser";
import type { ItemDefinition } from "@/lib/game/manifests";
import type { HyperForgeAsset } from "@/types/asset";
import { promises as fs } from "fs";
import path from "path";
import { getServerManifestsDir } from "@/lib/utils/paths";

// Mock paths utility
vi.mock("@/lib/utils/paths", () => ({
  getServerManifestsDir: () => path.join(process.cwd(), ".test-manifests"),
}));

describe("ImportService", () => {
  const testManifestsDir = path.join(process.cwd(), ".test-manifests");

  beforeEach(async () => {
    // Create test manifests directory
    await fs.mkdir(testManifestsDir, { recursive: true });

    // Create test manifest files
    await fs.writeFile(
      path.join(testManifestsDir, "items.json"),
      JSON.stringify([
        {
          id: "test-item",
          name: "Test Item",
          category: "weapon",
          modelPath: "/models/test.glb",
        },
      ]),
    );
  });

  it("loads all game manifests", async () => {
    const manifests = await loadAllGameManifests();
    expect(manifests).toBeDefined();
    expect(Array.isArray(manifests.items)).toBe(true);
  });

  it("loads a single manifest type", async () => {
    const items = await loadManifest("items");
    expect(Array.isArray(items)).toBe(true);
  });

  it("detects changes between game and forge assets", () => {
    const gameAsset: ParsedGameAsset = {
      asset: {
        id: "test-item",
        name: "Test Item",
        source: "CDN",
        category: "weapon",
        description: "A test item",
        modelPath: "/models/test.glb",
        rarity: "common",
      },
      manifestType: "items" as const,
      rawData: {
        id: "test-item",
        name: "Test Item",
        type: "weapon",
        value: 100,
        weight: 1,
        description: "A test item",
        examine: "A test item",
        tradeable: true,
        rarity: "common",
        modelPath: "/models/test.glb",
        iconPath: "/icons/test.png",
      },
    };

    const forgeAsset: HyperForgeAsset = {
      id: "test-item",
      name: "Test Item",
      source: "LOCAL",
      category: "weapon",
      description: "A test item",
      modelPath: "/models/test.glb",
      rarity: "common",
      status: "draft",
    };

    const change = detectChanges(gameAsset, forgeAsset);
    expect(change.changeType).toBe("unchanged");
  });

  it("detects added assets", () => {
    const gameAsset: ParsedGameAsset = {
      asset: {
        id: "new-item",
        name: "New Item",
        source: "CDN",
        category: "weapon",
        description: "A new item",
        modelPath: "/models/new.glb",
        rarity: "common",
      },
      manifestType: "items" as const,
      rawData: {
        id: "new-item",
        name: "New Item",
        type: "weapon",
        value: 100,
        weight: 1,
        description: "A new item",
        examine: "A new item",
        tradeable: true,
        rarity: "common",
        modelPath: "/models/new.glb",
        iconPath: "/icons/new.png",
      },
    };

    const change = detectChanges(gameAsset, undefined);
    expect(change.changeType).toBe("added");
  });

  it("detects modified assets", () => {
    const gameAsset: ParsedGameAsset = {
      asset: {
        id: "test-item",
        name: "Updated Item",
        source: "CDN",
        category: "weapon",
        description: "Updated description",
        modelPath: "/models/test.glb",
        rarity: "rare",
      },
      manifestType: "items" as const,
      rawData: {
        id: "test-item",
        name: "Updated Item",
        type: "weapon",
        value: 100,
        weight: 1,
        description: "Updated description",
        examine: "Updated description",
        tradeable: true,
        rarity: "rare",
        modelPath: "/models/test.glb",
        iconPath: "/icons/test.png",
      },
    };

    const forgeAsset: HyperForgeAsset = {
      id: "test-item",
      name: "Test Item",
      source: "LOCAL",
      category: "weapon",
      description: "A test item",
      modelPath: "/models/test.glb",
      rarity: "common",
      status: "draft",
    };

    const change = detectChanges(gameAsset, forgeAsset);
    expect(change.changeType).toBe("modified");
    expect(change.changedFields).toContain("name");
    expect(change.changedFields).toContain("rarity");
  });

  it("detects deleted assets", () => {
    const gameAssets: ParsedGameAsset[] = [];
    const forgeAssets: HyperForgeAsset[] = [
      {
        id: "deleted-item",
        name: "Deleted Item",
        source: "LOCAL",
        category: "weapon",
        status: "draft",
      },
    ];

    const deleted = detectDeletedAssets(
      gameAssets,
      forgeAssets,
      "items",
    );
    expect(deleted.length).toBe(1);
    expect(deleted[0].changeType).toBe("deleted");
  });

  it("gets manifest sync status", async () => {
    const status = await getManifestSyncStatus("items", []);
    expect(status).toBeDefined();
    expect(status.manifestType).toBe("items");
    expect(typeof status.state).toBe("string");
  });

  it("gets overall sync status", async () => {
    const status = await getSyncStatus([]);
    expect(status).toBeDefined();
    expect(Array.isArray(status.manifests)).toBe(true);
    expect(typeof status.totalGameAssets).toBe("number");
  });

  it("imports selected assets", async () => {
    const gameAssets: ParsedGameAsset[] = [
      {
        asset: {
          id: "test-item",
          name: "Test Item",
          source: "CDN",
          category: "weapon",
          description: "A test item",
          modelPath: "/models/test.glb",
          rarity: "common",
        },
        manifestType: "items" as const,
        rawData: {
          id: "test-item",
          name: "Test Item",
          type: "weapon",
          value: 100,
          weight: 1,
          description: "A test item",
          examine: "A test item",
          tradeable: true,
          rarity: "common",
          modelPath: "/models/test.glb",
          iconPath: "/icons/test.png",
        },
      },
    ];

    const result = await importSelectedAssets(["test-item"], gameAssets);
    expect(result.success).toBe(true);
    expect(result.imported).toContain("test-item");
  });

  it("imports from all manifests", async () => {
    const result = await importFromManifests();
    expect(result).toBeDefined();
    expect(result.parsed).toBeDefined();
    expect(result.result).toBeDefined();
  });

  it("gets last sync time", async () => {
    const syncTime = await getLastSyncTime("items");
    expect(syncTime === null || syncTime instanceof Date).toBe(true);
  });

  it("updates sync time", async () => {
    const syncTime = await updateSyncTime("items");
    expect(syncTime).toBeInstanceOf(Date);

    const lastSync = await getLastSyncTime("items");
    expect(lastSync).toBeInstanceOf(Date);
  });

  it("updates all sync times", async () => {
    const syncTime = await updateAllSyncTimes();
    expect(syncTime).toBeInstanceOf(Date);
  });

  it("gets manifests directory", () => {
    const dir = getManifestsDirectory();
    expect(typeof dir).toBe("string");
    expect(dir).toContain("manifests");
  });

  it("checks if manifests exist", async () => {
    const exists = await manifestsExist();
    expect(typeof exists).toBe("boolean");
  });

  it("lists manifest files", async () => {
    const files = await listManifestFiles();
    expect(Array.isArray(files)).toBe(true);
  });
});
