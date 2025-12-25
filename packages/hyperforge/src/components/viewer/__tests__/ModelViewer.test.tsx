/**
 * ModelViewer Component Tests
 *
 * Tests for the model viewer component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ModelViewer } from "../ModelViewer";

describe("ModelViewer", () => {
  it("renders without crashing", () => {
    const { container } = render(<ModelViewer />);
    expect(container).toBeTruthy();
  });
});
