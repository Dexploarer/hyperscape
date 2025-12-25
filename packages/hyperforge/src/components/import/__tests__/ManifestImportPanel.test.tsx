/**
 * ManifestImportPanel Component Tests
 *
 * Tests for the manifest import panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ManifestImportPanel } from "../ManifestImportPanel";

describe("ManifestImportPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<ManifestImportPanel />);
    expect(container).toBeTruthy();
  });
});
