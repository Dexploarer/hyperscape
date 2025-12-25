/**
 * SpectacularButton Component Tests
 *
 * Tests for the spectacular button component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SpectacularButton } from "../spectacular-button";

describe("SpectacularButton", () => {
  it("renders without crashing", () => {
    render(<SpectacularButton>Click me</SpectacularButton>);
    expect(document.body).toBeTruthy();
  });
});
