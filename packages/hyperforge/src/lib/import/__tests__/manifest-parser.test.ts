/**
 * Manifest Parser Tests
 *
 * Tests for manifest parsing utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  parseItemsManifest,
  parseNPCsManifest,
  parseResourcesManifest,
  parseStoresManifest,
  parseMusicManifest,
  parseAllManifests,
} from "../manifest-parser";
import type {
  ItemDefinition,
  NpcDefinition,
  ResourceDefinition,
  StoreDefinition,
  MusicTrack,
} from "@/lib/game/manifests";

describe("ManifestParser", () => {
  it("parses items manifest", () => {
    const items: ItemDefinition[] = [
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
    ];

    const parsed = parseItemsManifest(items);
    expect(parsed.length).toBe(1);
    expect(parsed[0].asset.id).toBe("test-item");
    expect(parsed[0].manifestType).toBe("items");
  });

  it("parses NPCs manifest", () => {
    const npcs: NpcDefinition[] = [
      {
        id: "test-npc",
        name: "Test NPC",
        category: "mob",
        description: "A test NPC",
        faction: "hostile",
      },
    ];

    const parsed = parseNPCsManifest(npcs);
    expect(parsed.length).toBe(1);
    expect(parsed[0].asset.id).toBe("test-npc");
    expect(parsed[0].manifestType).toBe("npcs");
  });

  it("parses resources manifest", () => {
    const resources: ResourceDefinition[] = [
      {
        id: "test-resource",
        name: "Test Resource",
        type: "tree",
        examine: "A test resource",
        modelPath: "/models/tree.glb",
        scale: 1,
        harvestSkill: "woodcutting",
        levelRequired: 1,
        baseCycleTicks: 3,
        depleteChance: 0.1,
        respawnTicks: 100,
        harvestYield: [],
        toolRequired: "axe",
      },
    ];

    const parsed = parseResourcesManifest(resources);
    expect(parsed.length).toBe(1);
    expect(parsed[0].asset.id).toBe("test-resource");
    expect(parsed[0].manifestType).toBe("resources");
  });

  it("parses stores manifest", () => {
    const stores: StoreDefinition[] = [
      {
        id: "test-store",
        name: "Test Store",
        description: "A test store",
        items: [],
        buyback: false,
        buybackRate: 0.5,
      },
    ];

    const parsed = parseStoresManifest(stores);
    expect(parsed.length).toBe(1);
    expect(parsed[0].asset.id).toBe("test-store");
    expect(parsed[0].manifestType).toBe("stores");
  });

  it("parses music manifest", () => {
    const music: MusicTrack[] = [
      {
        id: "test-track",
        name: "Test Track",
        type: "ambient",
        category: "ambient",
        path: "/music/test.mp3",
        description: "A test track",
        duration: 120,
        mood: "calm",
      },
    ];

    const parsed = parseMusicManifest(music);
    expect(parsed.length).toBe(1);
    expect(parsed[0].asset.id).toBe("test-track");
    expect(parsed[0].manifestType).toBe("music");
  });

  it("parses all manifests", () => {
    const manifests = {
      items: [
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
      ],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    };

    const parsed = parseAllManifests({
      items: manifests.items as ItemDefinition[],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    });
    expect(parsed.items.length).toBe(1);
    expect(parsed.npcs.length).toBe(0);
    expect(parsed.totalCount).toBe(1);
  });
});
