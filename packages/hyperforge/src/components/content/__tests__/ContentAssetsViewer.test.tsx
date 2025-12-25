/**
 * ContentAssetsViewer Component Tests
 *
 * Tests for the content assets viewer component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ContentAssetsViewer } from "../ContentAssetsViewer";

describe("ContentAssetsViewer", () => {
  it("renders without crashing", () => {
    const { container } = render(<ContentAssetsViewer />);
    expect(container).toBeTruthy();
  });
});
