/**
 * EnvironmentControls Component Tests
 *
 * Tests for the environment controls component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EnvironmentControls } from "../EnvironmentControls";

describe("EnvironmentControls", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <EnvironmentControls
        environment="studio"
        onEnvironmentChange={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });
});
