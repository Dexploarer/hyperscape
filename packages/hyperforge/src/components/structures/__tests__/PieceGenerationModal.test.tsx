/**
 * PieceGenerationModal Component Tests
 *
 * Tests for the piece generation modal component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { PieceGenerationModal } from "../PieceGenerationModal";
import type { BuildingPiece } from "@/types/structures";

describe("PieceGenerationModal", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <PieceGenerationModal
        isOpen={true}
        onClose={vi.fn()}
        onGenerated={vi.fn((_piece: BuildingPiece) => {})}
      />,
    );
    expect(container).toBeTruthy();
  });
});
