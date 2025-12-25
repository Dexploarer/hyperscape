/**
 * Select Component Tests
 *
 * Tests for the select component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Select } from "../select";

describe("Select", () => {
  it("renders without crashing", () => {
    render(
      <Select
        value="option1"
        onChange={() => {}}
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ]}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
