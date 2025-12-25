/**
 * RetargetingPanel Component Tests
 *
 * Tests for the retargeting panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RetargetingPanel } from "../RetargetingPanel";

describe("RetargetingPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<RetargetingPanel />);
    expect(container).toBeTruthy();
  });
});
