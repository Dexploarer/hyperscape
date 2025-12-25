/**
 * HandRiggingPanel Component Tests
 *
 * Tests for the hand rigging panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HandRiggingPanel } from "../HandRiggingPanel";

describe("HandRiggingPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<HandRiggingPanel />);
    expect(container).toBeTruthy();
  });
});
