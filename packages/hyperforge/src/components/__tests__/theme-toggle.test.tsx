/**
 * ThemeToggle Component Tests
 *
 * Tests for the theme toggle component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeToggle } from "../theme-toggle";

describe("ThemeToggle", () => {
  it("renders without crashing", () => {
    render(<ThemeToggle />);
    expect(document.body).toBeTruthy();
  });
});
