/**
 * ExportHistory Component Tests
 *
 * Tests for the export history component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ExportHistory } from "../ExportHistory";

describe("ExportHistory", () => {
  it("renders without crashing", () => {
    const { container } = render(<ExportHistory />);
    expect(container).toBeTruthy();
  });
});
