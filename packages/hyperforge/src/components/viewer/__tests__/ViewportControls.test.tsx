/**
 * ViewportControls Component Tests
 *
 * Tests for the viewport controls component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ViewportControls } from "../ViewportControls";

describe("ViewportControls", () => {
  it("renders without crashing", () => {
    const { container } = render(<ViewportControls />);
    expect(container).toBeTruthy();
  });
});
