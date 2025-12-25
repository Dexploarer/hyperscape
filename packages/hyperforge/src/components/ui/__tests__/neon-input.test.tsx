/**
 * NeonInput Component Tests
 *
 * Tests for the neon input component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NeonInput } from "../neon-input";

describe("NeonInput", () => {
  it("renders without crashing", () => {
    render(<NeonInput placeholder="Enter text" />);
    expect(document.body).toBeTruthy();
  });
});
