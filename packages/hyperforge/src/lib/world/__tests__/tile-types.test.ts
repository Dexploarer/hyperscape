/**
 * Tile Types Tests
 *
 * Tests for tile type utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  worldToTile,
  tileToWorld,
  tileKey,
  parseTileKey,
  isInBounds,
  getAreaCategory,
} from "../tile-types";
import type { TileCoord, AreaBounds } from "../tile-types";

describe("TileTypes", () => {
  it("converts world position to tile coordinates", () => {
    const worldPos = { x: 5.7, y: 0, z: 3.2 };
    const tile = worldToTile(worldPos);

    expect(tile.x).toBe(5);
    expect(tile.z).toBe(3);
  });

  it("converts tile coordinates to world position", () => {
    const coord: TileCoord = { x: 5, z: 3 };
    const worldPos = tileToWorld(coord, 10);

    expect(worldPos.x).toBe(5.5);
    expect(worldPos.y).toBe(10);
    expect(worldPos.z).toBe(3.5);
  });

  it("generates tile key", () => {
    const coord: TileCoord = { x: 5, z: 3 };
    const key = tileKey(coord);

    expect(key).toBe("5,3");
  });

  it("parses tile key", () => {
    const coord = parseTileKey("5,3");

    expect(coord.x).toBe(5);
    expect(coord.z).toBe(3);
  });

  it("checks if coordinate is in bounds", () => {
    const bounds: AreaBounds = { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
    const coord1: TileCoord = { x: 5, z: 5 };
    const coord2: TileCoord = { x: 15, z: 15 };

    expect(isInBounds(coord1, bounds)).toBe(true);
    expect(isInBounds(coord2, bounds)).toBe(false);
  });

  it("gets area category from difficulty level", () => {
    expect(getAreaCategory(0)).toBe("starterTowns");
    expect(getAreaCategory(1)).toBe("level1Areas");
    expect(getAreaCategory(2)).toBe("level2Areas");
    expect(getAreaCategory(3)).toBe("level3Areas");
  });
});
