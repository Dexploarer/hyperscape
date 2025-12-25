/**
 * Asset Graph Tests
 *
 * Tests for asset graph building.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import { buildAssetGraph } from "../asset-graph";
import type { ManifestData } from "../asset-graph";

describe("AssetGraph", () => {
  it("builds graph from manifest data", () => {
    const manifests: ManifestData = {
      items: [
        {
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
      ],
      npcs: [],
      resources: [],
      stores: [],
      areas: [],
    };

    const graph = buildAssetGraph(manifests);

    expect(graph).toBeDefined();
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(Array.isArray(graph.edges)).toBe(true);
  });

  it("creates nodes for items", () => {
    const manifests: ManifestData = {
      items: [
        {
          id: "sword",
          name: "Sword",
          type: "weapon",
          value: 100,
          weight: 1,
          description: "A sword",
          examine: "A sword",
          tradeable: true,
          rarity: "common",
          modelPath: "/models/sword.glb",
          iconPath: "/icons/sword.png",
        },
      ],
      npcs: [],
      resources: [],
      stores: [],
      areas: [],
    };

    const graph = buildAssetGraph(manifests);
    expect(graph.nodes.some((n) => n.id === "sword")).toBe(true);
  });

  it("creates edges for relationships", () => {
    const manifests: ManifestData = {
      items: [
        {
          id: "sword",
          name: "Sword",
          type: "weapon",
          value: 100,
          weight: 1,
          description: "A sword",
          examine: "A sword",
          tradeable: true,
          rarity: "common",
          modelPath: "/models/sword.glb",
          iconPath: "/icons/sword.png",
        },
      ],
      npcs: [
        {
          id: "goblin",
          name: "Goblin",
          category: "mob",
          description: "A goblin",
          faction: "hostile",
          drops: {
            always: [],
            common: [{ itemId: "sword", chance: 0.1, minQuantity: 1, maxQuantity: 1, rarity: "common" }],
            uncommon: [],
            rare: [],
            veryRare: [],
          },
        },
      ],
      resources: [],
      stores: [],
      areas: [],
    };

    const graph = buildAssetGraph(manifests);
    expect(graph.edges.length).toBeGreaterThan(0);
  });
});
