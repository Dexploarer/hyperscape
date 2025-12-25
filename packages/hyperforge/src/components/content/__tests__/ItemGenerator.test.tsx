/**
 * ItemGenerator Component Tests
 *
 * Tests for the item generator component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ItemGenerator } from "../ItemGenerator";

describe("ItemGenerator", () => {
  it("renders without crashing", () => {
    const { container } = render(<ItemGenerator />);
    expect(container).toBeTruthy();
  });
});
