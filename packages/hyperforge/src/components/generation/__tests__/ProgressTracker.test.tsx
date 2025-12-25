/**
 * ProgressTracker Component Tests
 *
 * Tests for the progress tracker component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProgressTracker } from "../ProgressTracker";

describe("ProgressTracker", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ProgressTracker
        progress={50}
        currentStep="Processing..."
      />,
    );
    expect(container).toBeTruthy();
  });
});
