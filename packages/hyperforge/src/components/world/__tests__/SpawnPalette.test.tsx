/**
 * SpawnPalette Component Tests
 *
 * Tests for the spawn palette component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { SpawnPalette } from "../SpawnPalette";
import type { PlaceableItem } from "@/lib/world/tile-types";

describe("SpawnPalette", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <SpawnPalette
        onSelectItem={vi.fn((_item: PlaceableItem) => {})}
        selectedItem={null}
      />,
    );
    expect(container).toBeTruthy();
  });
});
