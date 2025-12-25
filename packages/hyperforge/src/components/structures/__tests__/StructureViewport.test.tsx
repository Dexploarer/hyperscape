/**
 * StructureViewport Component Tests
 *
 * Tests for the structure viewport component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { StructureViewport } from "../StructureViewport";
import type { BuildingPiece } from "@/types/structures";

describe("StructureViewport", () => {
  it("renders without crashing", () => {
    render(
      <StructureViewport
        structure={null}
        selectedPieceId={null}
        onSelectPiece={vi.fn()}
        placingPiece={null}
        onPlacePiece={vi.fn()}
        onPlacingComplete={vi.fn()}
        tool="select"
        transformMode="translate"
        gridConfig={{ enabled: true, size: 1, rotationSnap: 15, showGrid: true, gridHeight: 0 }}
        onTransformPiece={vi.fn()}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
