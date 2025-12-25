/**
 * WorldCanvas Component Tests
 *
 * Tests for the world canvas component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { WorldCanvas } from "../WorldCanvas";
import type { WorldEntity } from "../WorldView";
import type { AssetData } from "@/types/asset";

describe("WorldCanvas", () => {
  it("renders without crashing", () => {
    const entities: WorldEntity[] = [];
    render(
      <WorldCanvas
        entities={entities}
        selectedEntity={null}
        onSelectEntity={vi.fn()}
        onMoveEntity={vi.fn()}
        onAddEntity={vi.fn((_asset: AssetData, _position: { x: number; y: number }) => {})}
        gridSize={1}
        zoom={1}
        showGrid={true}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
