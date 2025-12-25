import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TileInspector } from "../TileInspector";
import type { WorldAreaDefinition } from "@/lib/world/tile-types";

const mockArea: WorldAreaDefinition = {
  id: "test-area",
  name: "Test Area",
  description: "A test area for testing",
  difficultyLevel: 0,
  biomeType: "forest",
  safeZone: false,
  bounds: {
    minX: 0,
    maxX: 10,
    minZ: 0,
    maxZ: 10,
  },
  tiles: new Map(),
  spawnCounts: {
    mobs: 0,
    npcs: 0,
    resources: 0,
  },
};

describe("TileInspector", () => {
  it("shows empty state when no tile selected", () => {
    render(
      <TileInspector
        area={mockArea}
        onAreaChange={vi.fn()}
        selectedTile={null}
        selectedSpawn={null}
        onSelectSpawn={vi.fn()}
      />,
    );
    expect(screen.getByText("Select a tile to inspect")).toBeTruthy();
  });

  it("renders tile inspector when tile is selected", () => {
    render(
      <TileInspector
        area={mockArea}
        onAreaChange={vi.fn()}
        selectedTile={{ x: 5, z: 5 }}
        selectedSpawn={null}
        onSelectSpawn={vi.fn()}
      />,
    );
    expect(screen.getByText(/Tile \(5, 5\)/)).toBeTruthy();
  });
});
