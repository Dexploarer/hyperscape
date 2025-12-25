/**
 * WorldView Component Tests
 *
 * Tests for the world view component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WorldView } from "../WorldView";

describe("WorldView", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <WorldView isOpen={true} onClose={() => {}} />,
    );
    expect(container).toBeTruthy();
  });
});
