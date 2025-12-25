/**
 * GenerationPanel Component Tests
 *
 * Tests for the generation panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GenerationPanel } from "../GenerationPanel";

describe("GenerationPanel", () => {
  it("renders without crashing", () => {
    render(<GenerationPanel />);
    expect(document.body).toBeTruthy();
  });
});
