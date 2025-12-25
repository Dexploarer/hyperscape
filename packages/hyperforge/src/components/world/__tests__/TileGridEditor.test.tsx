import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TileGridEditor } from "../TileGridEditor";

import type { WorldAreaDefinition } from "@/lib/world/tile-types";

const mockArea: WorldAreaDefinition = {
  id: "test-area",
  name: "Test Area",
  description: "Test area description",
  difficultyLevel: 0,
  biomeType: "plains" as const,
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

describe("TileGridEditor", () => {
  const defaultProps = {
    area: mockArea,
    onAreaChange: vi.fn(),
    selectedTile: null,
    onSelectTile: vi.fn(),
    selectedSpawn: null,
    onSelectSpawn: vi.fn(),
    selectedTiles: [],
    onSelectTiles: vi.fn(),
    placingItem: null,
    onPlacingItemUsed: vi.fn(),
    tool: "select" as const,
  };

  it("renders empty state when no area is provided", () => {
    render(<TileGridEditor {...defaultProps} area={null} />);
    expect(screen.getByText("No area selected")).toBeTruthy();
  });

  it("renders area information when area is provided", () => {
    render(<TileGridEditor {...defaultProps} />);
    expect(screen.getByText("Test Area")).toBeTruthy();
  });

  it("displays area size", () => {
    render(<TileGridEditor {...defaultProps} />);
    expect(screen.getByText(/10 × 10/)).toBeTruthy();
  });

  it("displays zoom controls", () => {
    render(<TileGridEditor {...defaultProps} />);
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("displays spawn counts", () => {
    const areaWithSpawns: WorldAreaDefinition = {
      ...mockArea,
      spawnCounts: {
        mobs: 5,
        npcs: 3,
        resources: 2,
      },
    };
    
    render(<TileGridEditor {...defaultProps} area={areaWithSpawns} />);
    expect(screen.getByText("5 mobs")).toBeTruthy();
    expect(screen.getByText("3 NPCs")).toBeTruthy();
    expect(screen.getByText("2 resources")).toBeTruthy();
  });
});
