/**
 * SnapshotDiffViewer Component Tests
 *
 * Tests for the snapshot diff viewer component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SnapshotDiffViewer } from "../SnapshotDiffViewer";
import type { SnapshotDiff } from "@/lib/versioning/version-control";

describe("SnapshotDiffViewer", () => {
  it("renders without crashing", () => {
    const diff: SnapshotDiff = {
      fromSnapshotId: "snap1",
      toSnapshotId: "snap2",
      calculatedAt: new Date().toISOString(),
      changes: [],
      summary: {
        added: 0,
        deleted: 0,
        modified: 0,
        total: 0,
      },
    };
    const { container } = render(<SnapshotDiffViewer diff={diff} />);
    expect(container).toBeTruthy();
  });
});
