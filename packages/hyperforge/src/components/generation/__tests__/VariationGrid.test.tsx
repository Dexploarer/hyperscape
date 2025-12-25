/**
 * VariationGrid Component Tests
 *
 * Tests for the variation grid component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { VariationGrid } from "../VariationGrid";

describe("VariationGrid", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <VariationGrid
        variations={[]}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onDownload={vi.fn()}
        onSaveAll={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
