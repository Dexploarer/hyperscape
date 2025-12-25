/**
 * AreaGenerator Component Tests
 *
 * Tests for the area generator component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AreaGenerator } from "../AreaGenerator";

describe("AreaGenerator", () => {
  it("renders without crashing", () => {
    const { container } = render(<AreaGenerator />);
    expect(container).toBeTruthy();
  });
});
