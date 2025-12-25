/**
 * GlassPanel Component Tests
 *
 * Tests for the glass panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GlassPanel } from "../glass-panel";

describe("GlassPanel", () => {
  it("renders without crashing", () => {
    render(
      <GlassPanel>
        <p>Panel content</p>
      </GlassPanel>,
    );
    expect(document.body).toBeTruthy();
  });
});
