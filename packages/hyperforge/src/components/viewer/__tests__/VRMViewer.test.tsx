/**
 * VRMViewer Component Tests
 *
 * Tests for the VRM viewer component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { VRMViewer } from "../VRMViewer";

describe("VRMViewer", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <VRMViewer
        vrmUrl=""
        onLoad={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });
});
