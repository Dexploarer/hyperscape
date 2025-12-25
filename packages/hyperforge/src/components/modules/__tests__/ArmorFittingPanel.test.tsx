/**
 * ArmorFittingPanel Component Tests
 *
 * Tests for the armor fitting panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ArmorFittingPanel } from "../ArmorFittingPanel";

describe("ArmorFittingPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<ArmorFittingPanel />);
    expect(container).toBeTruthy();
  });
});
