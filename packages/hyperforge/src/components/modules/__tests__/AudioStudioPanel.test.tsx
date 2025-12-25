/**
 * AudioStudioPanel Component Tests
 *
 * Tests for the audio studio panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AudioStudioPanel } from "../AudioStudioPanel";

describe("AudioStudioPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<AudioStudioPanel />);
    expect(container).toBeTruthy();
  });
});
