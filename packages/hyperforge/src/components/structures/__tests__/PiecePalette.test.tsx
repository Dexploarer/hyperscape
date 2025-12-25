/**
 * PiecePalette Component Tests
 *
 * Tests for the piece palette component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { PiecePalette } from "../PiecePalette";
import type { BuildingPiece } from "@/types/structures";

describe("PiecePalette", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <PiecePalette
        onSelectPiece={vi.fn((_piece: BuildingPiece) => {})}
        selectedPiece={null}
      />,
    );
    expect(container).toBeTruthy();
  });
});
