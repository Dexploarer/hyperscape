/**
 * DiffViewer Component Tests
 *
 * Tests for the diff viewer component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DiffViewer } from "../DiffViewer";
import type { VersionDiff } from "@/lib/versioning/version-types";

describe("DiffViewer", () => {
  it("renders without crashing", () => {
    const diff: VersionDiff = {
      fromVersionId: "v1",
      toVersionId: "v2",
      assetId: "test-asset",
      calculatedAt: new Date().toISOString(),
      hasChanges: false,
      changeCount: 0,
      changes: [],
      summary: {
        added: 0,
        deleted: 0,
        modified: 0,
      },
    };
    const { container } = render(<DiffViewer diff={diff} />);
    expect(container).toBeTruthy();
  });
});
