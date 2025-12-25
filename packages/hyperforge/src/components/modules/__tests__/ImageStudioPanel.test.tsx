/**
 * ImageStudioPanel Component Tests
 *
 * Tests for the image studio panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ImageStudioPanel } from "../ImageStudioPanel";

describe("ImageStudioPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<ImageStudioPanel />);
    expect(container).toBeTruthy();
  });
});
