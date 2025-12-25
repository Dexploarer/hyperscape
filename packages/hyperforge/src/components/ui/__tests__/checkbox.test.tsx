/**
 * Checkbox Component Tests
 *
 * Tests for the checkbox component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Checkbox } from "../checkbox";

describe("Checkbox", () => {
  it("renders without crashing", () => {
    render(
      <Checkbox
        checked={false}
        onCheckedChange={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
