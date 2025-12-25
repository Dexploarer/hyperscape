/**
 * ResultPreview Component Tests
 *
 * Tests for the result preview component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ResultPreview } from "../ResultPreview";

describe("ResultPreview", () => {
  it("renders without crashing", () => {
    const { container } = render(<ResultPreview />);
    expect(container).toBeTruthy();
  });
});
