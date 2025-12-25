/**
 * Terrain Preview Tests
 *
 * Tests for terrain preview generation.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  getTerrainPreview,
  TerrainPreview,
} from "../terrain-preview";

describe("TerrainPreview", () => {
  it("creates terrain preview instance", () => {
    const preview = getTerrainPreview(12345);
    expect(preview).toBeInstanceOf(TerrainPreview);
  });

  it("gets tile data", () => {
    const preview = getTerrainPreview(12345);
    const tileData = preview.getTileData(0, 0);
    expect(tileData).toBeDefined();
    expect(tileData.biome).toBeDefined();
    expect(tileData.color).toBeDefined();
  });

  it("handles different tile coordinates", () => {
    const preview = getTerrainPreview(12345);
    const tile1 = preview.getTileData(0, 0);
    const tile2 = preview.getTileData(10, 10);

    expect(tile1).toBeDefined();
    expect(tile2).toBeDefined();
  });
});
