/**
 * StructureInspector Component Tests
 *
 * Tests for the structure inspector component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { StructureInspector } from "../StructureInspector";

describe("StructureInspector", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <StructureInspector
        mode="pieces"
        structure={null}
        selectedPieceId={null}
        onSelectPiece={vi.fn()}
        onUpdateStructure={vi.fn()}
        onRemovePiece={vi.fn()}
        onUpdatePieceTransform={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
