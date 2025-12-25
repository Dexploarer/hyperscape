/**
 * ImageAssetsViewer Component Tests
 *
 * Tests for the image assets viewer component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ImageAssetsViewer } from "../ImageAssetsViewer";

describe("ImageAssetsViewer", () => {
  it("renders without crashing", () => {
    const { container } = render(<ImageAssetsViewer />);
    expect(container).toBeTruthy();
  });
});
