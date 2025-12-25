/**
 * CategorySelector Component Tests
 *
 * Tests for the category selector component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CategorySelector } from "../CategorySelector";

describe("CategorySelector", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <CategorySelector
        isOpen
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
