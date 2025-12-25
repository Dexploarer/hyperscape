/**
 * CategoryTree Component Tests
 *
 * Tests for the category tree component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CategoryTree } from "../CategoryTree";

describe("CategoryTree", () => {
  it("renders without crashing", () => {
    const { container } = render(<CategoryTree />);
    expect(container).toBeTruthy();
  });
});
