/**
 * ThemeProvider Component Tests
 *
 * Tests for the theme provider component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../theme-provider";

describe("ThemeProvider", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>,
    );
    expect(container).toBeTruthy();
  });
});
