/**
 * Slider Component Tests
 *
 * Tests for the slider component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Slider } from "../slider";

describe("Slider", () => {
  it("renders without crashing", () => {
    render(
      <Slider
        value={[50]}
        onValueChange={() => {}}
        min={0}
        max={100}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
