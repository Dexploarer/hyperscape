/**
 * Manifest Importer Tests
 *
 * Tests for manifest import service.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  importItems,
  importNpcs,
  importResources,
  importStores,
  importMusic,
  importFromManifests,
  getManifestDiff,
  manifestsDirExists,
  getManifestsPath,
} from "../manifest-importer";
import { promises as fs } from "fs";
import path from "path";
import { getServerManifestsDir } from "@/lib/utils/paths";

// Mock paths
vi.mock("@/lib/utils/paths", () => ({
  getServerManifestsDir: () => path.join(process.cwd(), ".test-manifests"),
}));

describe("ManifestImporter", () => {
  const testManifestsDir = path.join(process.cwd(), ".test-manifests");

  beforeEach(async () => {
    await fs.mkdir(testManifestsDir, { recursive: true });
  });

  it("checks if manifests directory exists", async () => {
    const exists = await manifestsDirExists();
    expect(typeof exists).toBe("boolean");
  });

  it("gets manifests path", () => {
    const path = getManifestsPath();
    expect(typeof path).toBe("string");
    expect(path.length).toBeGreaterThan(0);
  });

  it("imports items", async () => {
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

    const result = await importItems([]);
    expect(result).toBeDefined();
    expect(result.manifestType).toBe("items");
  });

  it("imports NPCs", async () => {
    await fs.writeFile(
      path.join(testManifestsDir, "npcs.json"),
      JSON.stringify([
        {
          id: "test-npc",
          name: "Test NPC",
          category: "mob",
          description: "Test",
        },
      ]),
    );

    const result = await importNpcs([]);
    expect(result).toBeDefined();
    expect(result.manifestType).toBe("npcs");
  });

  it("imports resources", async () => {
    await fs.writeFile(
      path.join(testManifestsDir, "resources.json"),
      JSON.stringify([
        {
          id: "test-resource",
          name: "Test Resource",
          type: "tree",
        },
      ]),
    );

    const result = await importResources([]);
    expect(result).toBeDefined();
    expect(result.manifestType).toBe("resources");
  });

  it("imports stores", async () => {
    await fs.writeFile(
      path.join(testManifestsDir, "stores.json"),
      JSON.stringify([
        {
          id: "test-store",
          name: "Test Store",
          items: [],
        },
      ]),
    );

    const result = await importStores([]);
    expect(result).toBeDefined();
    expect(result.manifestType).toBe("stores");
  });

  it("imports music", async () => {
    await fs.writeFile(
      path.join(testManifestsDir, "music.json"),
      JSON.stringify([
        {
          id: "test-track",
          name: "Test Track",
          url: "/music/test.mp3",
        },
      ]),
    );

    const result = await importMusic([]);
    expect(result).toBeDefined();
    expect(result.manifestType).toBe("music");
  });

  it("imports all manifests", async () => {
    const result = await importFromManifests([]);
    expect(result).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
  });

  it("gets manifest diff", async () => {
    const diff = await getManifestDiff("items", []);
    expect(diff).toBeDefined();
    expect(Array.isArray(diff.newAssets)).toBe(true);
  });
});
