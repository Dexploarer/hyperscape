/**
 * Tile Service Tests
 *
 * Tests for tile service operations.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  getTileContents,
  getOrCreateTile,
  setTileSpawn,
  removeTileSpawn,
  getTilesInRadius,
  getTilesWithSpawns,
  createEmptyArea,
  resizeAreaBounds,
  areasOverlap,
  validateAreaBounds,
  convertWorldAreasToEditor,
  convertEditorToWorldAreas,
  createSpawnFromItem,
  getTileAtPosition,
  setTileSpawns,
  clearTile,
  moveTileSpawn,
  updateSpawn,
  setTileProperties,
  getSpawnsByType,
  findSpawnById,
  duplicateSpawn,
  validateMobSpawn,
  validateNpcSpawn,
  validateResourceSpawn,
  validateSpawn,
} from "../tile-service";
import type {
  WorldAreaDefinition,
  TileCoord,
  TileSpawn,
  MobSpawnConfig,
  NpcSpawnConfig,
  ResourceSpawnConfig,
  PlaceableItem,
} from "../tile-types";

describe("TileService", () => {
  const testArea: WorldAreaDefinition = createEmptyArea(
    "test-area",
    "Test Area",
    { minX: 0, maxX: 10, minZ: 0, maxZ: 10 },
    0,
  );

  it("creates empty area", () => {
    const area = createEmptyArea("test", "Test", {
      minX: 0,
      maxX: 10,
      minZ: 0,
      maxZ: 10,
    });

    expect(area.id).toBe("test");
    expect(area.name).toBe("Test");
    expect(area.tiles.size).toBe(0);
  });

  it("gets tile contents", () => {
    const coord: TileCoord = { x: 5, z: 5 };
    const contents = getTileContents(testArea, coord);

    expect(contents).toBeDefined();
    expect(contents?.coord.x).toBe(5);
    expect(contents?.coord.z).toBe(5);
  });

  it("returns null for out-of-bounds tile", () => {
    const coord: TileCoord = { x: 100, z: 100 };
    const contents = getTileContents(testArea, coord);
    expect(contents).toBeNull();
  });

  it("gets or creates tile", () => {
    const coord: TileCoord = { x: 3, z: 3 };
    const tile = getOrCreateTile(testArea, coord);

    expect(tile).toBeDefined();
    expect(tile.coord.x).toBe(3);
    expect(testArea.tiles.size).toBeGreaterThan(0);
  });

  it("sets tile spawn", () => {
    const coord: TileCoord = { x: 5, z: 5 };
    const spawn: MobSpawnConfig = {
      id: "test-spawn",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };

    const updatedArea = setTileSpawn(testArea, coord, spawn);
    expect(updatedArea.spawnCounts.mobs).toBe(1);
  });

  it("removes tile spawn", () => {
    const coord: TileCoord = { x: 5, z: 5 };
    const spawn: MobSpawnConfig = {
      id: "test-spawn",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };

    let area = setTileSpawn(testArea, coord, spawn);
    area = removeTileSpawn(area, coord, "test-spawn");

    expect(area.spawnCounts.mobs).toBe(0);
  });

  it("gets tiles in radius", () => {
    const center: TileCoord = { x: 5, z: 5 };
    const tiles = getTilesInRadius(center, 2, testArea.bounds);

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.some((t) => t.x === 5 && t.z === 5)).toBe(true);
  });

  it("gets tiles with spawns", () => {
    const coord: TileCoord = { x: 5, z: 5 };
    const spawn: MobSpawnConfig = {
      id: "test-spawn",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };

    const area = setTileSpawn(testArea, coord, spawn);
    const tilesWithSpawns = getTilesWithSpawns(area);

    expect(tilesWithSpawns.length).toBeGreaterThan(0);
  });

  it("resizes area bounds", () => {
    const area = createEmptyArea("test", "Test", {
      minX: 0,
      maxX: 10,
      minZ: 0,
      maxZ: 10,
    });

    const resized = resizeAreaBounds(area, {
      minX: 0,
      maxX: 5,
      minZ: 0,
      maxZ: 5,
    });

    expect(resized.bounds.maxX).toBe(5);
    expect(resized.bounds.maxZ).toBe(5);
  });

  it("checks if areas overlap", () => {
    const bounds1 = { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
    const bounds2 = { minX: 5, maxX: 15, minZ: 5, maxZ: 15 };

    expect(areasOverlap(bounds1, bounds2)).toBe(true);
  });

  it("validates area bounds don't overlap", () => {
    const area1 = createEmptyArea("area1", "Area 1", {
      minX: 0,
      maxX: 10,
      minZ: 0,
      maxZ: 10,
    });

    const newBounds = { minX: 5, maxX: 15, minZ: 5, maxZ: 15 };
    const validation = validateAreaBounds(newBounds, [area1]);

    expect(validation.valid).toBe(false);
    expect(validation.overlappingAreas).toContain("area1");
  });

  it("creates spawn from placeable item", () => {
    const item: PlaceableItem = {
      name: "Goblin",
      type: "mob",
      entityId: "goblin",
    };

    const coord: TileCoord = { x: 5, z: 5 };
    const spawn = createSpawnFromItem(item, coord);

    expect(spawn.type).toBe("mob");
    if (spawn.type === "mob" || spawn.type === "npc" || spawn.type === "resource") {
      expect(spawn.entityId).toBe("goblin");
    }
  });

  it("gets tile at position", () => {
    const tile = getTileAtPosition(testArea, 5.7, 5.3);
    expect(tile).toBeDefined();
    expect(tile?.coord.x).toBe(5);
    expect(tile?.coord.z).toBe(5);
  });

  it("clears tile", () => {
    const coord: TileCoord = { x: 5, z: 5 };
    const spawn: MobSpawnConfig = {
      id: "test-spawn",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };

    let area = setTileSpawn(testArea, coord, spawn);
    area = clearTile(area, coord);

    const contents = getTileContents(area, coord);
    expect(contents?.spawns.length).toBe(0);
  });

  it("moves tile spawn", () => {
    const fromCoord: TileCoord = { x: 5, z: 5 };
    const toCoord: TileCoord = { x: 6, z: 6 };
    const spawn: MobSpawnConfig = {
      id: "test-spawn",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };

    let area = setTileSpawn(testArea, fromCoord, spawn);
    area = moveTileSpawn(area, "test-spawn", fromCoord, toCoord);

    const fromContents = getTileContents(area, fromCoord);
    const toContents = getTileContents(area, toCoord);

    expect(fromContents?.spawns.length).toBe(0);
    expect(toContents?.spawns.length).toBe(1);
  });

  it("updates spawn", () => {
    const coord: TileCoord = { x: 5, z: 5 };
    const spawn: MobSpawnConfig = {
      id: "test-spawn",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };

    let area = setTileSpawn(testArea, coord, spawn);
    area = updateSpawn(area, coord, "test-spawn", {
      name: "Updated Goblin",
    });

    const contents = getTileContents(area, coord);
    const updatedSpawn = contents?.spawns.find((s) => s.id === "test-spawn");
    expect(updatedSpawn?.name).toBe("Updated Goblin");
  });

  it("sets tile properties", () => {
    const coord: TileCoord = { x: 5, z: 5 };
    const area = setTileProperties(testArea, coord, {
      walkable: false,
      safeZone: true,
      terrain: "water",
    });

    const contents = getTileContents(area, coord);
    expect(contents?.walkable).toBe(false);
    expect(contents?.safeZone).toBe(true);
    expect(contents?.terrain).toBe("water");
  });

  it("gets spawns by type", () => {
    const coord1: TileCoord = { x: 5, z: 5 };
    const coord2: TileCoord = { x: 6, z: 6 };
    const mobSpawn: MobSpawnConfig = {
      id: "mob-1",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };
    const npcSpawn: NpcSpawnConfig = {
      id: "npc-1",
      type: "npc",
      entityId: "shopkeeper",
      name: "Shopkeeper",
      position: { x: 6.5, y: 0, z: 6.5 },
      npcType: "shop",
    };

    let area = setTileSpawn(testArea, coord1, mobSpawn);
    area = setTileSpawn(area, coord2, npcSpawn);

    const mobs = getSpawnsByType(area, "mob");
    expect(mobs.length).toBe(1);
    expect(mobs[0].spawn.type).toBe("mob");
  });

  it("finds spawn by ID", () => {
    const coord: TileCoord = { x: 5, z: 5 };
    const spawn: MobSpawnConfig = {
      id: "test-spawn",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };

    const area = setTileSpawn(testArea, coord, spawn);
    const found = findSpawnById(area, "test-spawn");

    expect(found).toBeDefined();
    expect(found?.spawn.id).toBe("test-spawn");
  });

  it("duplicates spawn", () => {
    const sourceCoord: TileCoord = { x: 5, z: 5 };
    const targetCoord: TileCoord = { x: 6, z: 6 };
    const spawn: MobSpawnConfig = {
      id: "test-spawn",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 5.5, y: 0, z: 5.5 },
      spawnRadius: 3,
      maxCount: 1,
    };

    let area = setTileSpawn(testArea, sourceCoord, spawn);
    const result = duplicateSpawn(area, sourceCoord, "test-spawn", targetCoord);

    expect(result).toBeDefined();
    expect(result?.newSpawnId).toBeDefined();
    expect(result?.newSpawnId).not.toBe("test-spawn");
  });

  it("validates mob spawn", () => {
    const spawn: MobSpawnConfig = {
      id: "test",
      type: "mob",
      entityId: "goblin",
      name: "Goblin",
      position: { x: 0, y: 0, z: 0 },
      spawnRadius: 3,
      maxCount: 1,
    };

    const validation = validateMobSpawn(spawn, [
      {
        id: "goblin",
        name: "Goblin",
        category: "mob",
        description: "A goblin",
        faction: "hostile",
      },
    ]);

    expect(validation.valid).toBe(true);
  });

  it("validates NPC spawn", () => {
    const spawn: NpcSpawnConfig = {
      id: "test",
      type: "npc",
      entityId: "shopkeeper",
      name: "Shopkeeper",
      position: { x: 0, y: 0, z: 0 },
      npcType: "shop",
    };

    const validation = validateNpcSpawn(spawn, [
      {
        id: "shopkeeper",
        name: "Shopkeeper",
        category: "neutral" as const,
        description: "A shopkeeper",
        faction: "neutral",
      },
    ]);

    expect(validation.valid).toBe(true);
  });

  it("validates resource spawn", () => {
    const spawn: ResourceSpawnConfig = {
      id: "test",
      type: "resource",
      entityId: "tree",
      name: "Tree",
      position: { x: 0, y: 0, z: 0 },
      resourceType: "tree",
    };

    const validation = validateResourceSpawn(spawn, [
      {
        id: "tree",
        name: "Tree",
        type: "tree",
        examine: "A tree",
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
    ]);

    expect(validation.valid).toBe(true);
  });
});
