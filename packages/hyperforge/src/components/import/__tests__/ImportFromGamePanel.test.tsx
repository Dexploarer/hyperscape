/**
 * ImportFromGamePanel Component Tests
 *
 * Tests for the import from game panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ImportFromGamePanel } from "../ImportFromGamePanel";

describe("ImportFromGamePanel", () => {
  it("renders without crashing", () => {
    render(<ImportFromGamePanel />);
    expect(document.body).toBeTruthy();
  });
});
