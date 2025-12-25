/**
 * FullBuildingGenerationModal Component Tests
 *
 * Tests for the full building generation modal component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { FullBuildingGenerationModal } from "../FullBuildingGenerationModal";
import type { StructureDefinition } from "@/types/structures";

describe("FullBuildingGenerationModal", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <FullBuildingGenerationModal
        isOpen={true}
        onClose={vi.fn()}
        onGenerated={vi.fn((_building: StructureDefinition) => {})}
      />,
    );
    expect(container).toBeTruthy();
  });
});
