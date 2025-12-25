/**
 * StudioViewer Component Tests
 *
 * Tests for the studio viewer component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StudioViewer } from "../StudioViewer";

describe("StudioViewer", () => {
  it("renders without crashing", () => {
    render(<StudioViewer />);
    expect(document.body).toBeTruthy();
  });
});
