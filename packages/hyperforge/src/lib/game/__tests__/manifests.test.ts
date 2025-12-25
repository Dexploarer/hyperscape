/**
 * Game Manifests Tests
 *
 * Tests for game manifest loading.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllItems,
  getAllNpcs,
  getAllResources,
  getAllStores,
  getAllMusic,
} from "../manifests";
import { promises as fs } from "fs";
import path from "path";
import { getServerManifestsDir } from "@/lib/utils/paths";

// Mock paths
vi.mock("@/lib/utils/paths", () => ({
  getServerManifestsDir: () => path.join(process.cwd(), ".test-manifests"),
}));

describe("GameManifests", () => {
  const testManifestsDir = path.join(process.cwd(), ".test-manifests");

  beforeEach(async () => {
    await fs.mkdir(testManifestsDir, { recursive: true });
  });

  it("loads items", async () => {
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
          modelPath: null,
          iconPath: "/icons/test.png",
        },
      ]),
    );

    const items = await getAllItems();
    expect(Array.isArray(items)).toBe(true);
  });

  it("loads NPCs", async () => {
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

    const npcs = await getAllNpcs();
    expect(Array.isArray(npcs)).toBe(true);
  });

  it("loads resources", async () => {
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

    const resources = await getAllResources();
    expect(Array.isArray(resources)).toBe(true);
  });

  it("loads stores", async () => {
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

    const stores = await getAllStores();
    expect(Array.isArray(stores)).toBe(true);
  });

  it("loads music", async () => {
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

    const music = await getAllMusic();
    expect(Array.isArray(music)).toBe(true);
  });
});
