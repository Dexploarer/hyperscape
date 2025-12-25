/**
 * Version Types Tests
 *
 * Tests for version type definitions.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import type {
  ChangeType,
  AssetVersion,
  AssetVersionData,
  FieldChange,
  VersionDiff,
  DiffSummary,
  ExportRecord,
  ExportStatus,
  ExportedAsset,
  ExportHistory,
  AssetVersionStore,
  VersionStorage,
} from "../version-types";

describe("VersionTypes", () => {
  it("defines valid change types", () => {
    const changeTypes: ChangeType[] = ["added", "modified", "deleted"];
    changeTypes.forEach((type) => {
      expect(typeof type).toBe("string");
    });
  });

  it("defines asset version structure", () => {
    const version: AssetVersion = {
      id: "v1",
      assetId: "test-asset",
      label: "v1",
      createdAt: new Date().toISOString(),
      createdBy: "user",
      data: {
        name: "Test Asset",
        category: "weapon",
        metadata: {},
      },
      dataHash: "hash123",
      parentVersionId: null,
    };

    expect(version.id).toBe("v1");
    expect(version.assetId).toBe("test-asset");
  });

  it("defines field change structure", () => {
    const change: FieldChange = {
      path: "name",
      type: "modified",
      oldValue: "Old Name",
      newValue: "New Name",
    };

    expect(change.path).toBe("name");
    expect(change.type).toBe("modified");
  });

  it("defines version diff structure", () => {
    const diff: VersionDiff = {
      fromVersionId: "v1",
      toVersionId: "v2",
      assetId: "test-asset",
      calculatedAt: new Date().toISOString(),
      hasChanges: true,
      changeCount: 1,
      summary: {
        added: 0,
        modified: 1,
        deleted: 0,
      },
      changes: [],
    };

    expect(diff.fromVersionId).toBe("v1");
    expect(diff.toVersionId).toBe("v2");
  });

  it("defines export record structure", () => {
    const record: ExportRecord = {
      id: "exp-1",
      exportedAt: new Date().toISOString(),
      exportedBy: "user",
      manifestTypes: ["items"],
      assetCount: 1,
      assets: [],
      status: "completed",
    };

    expect(record.id).toBe("exp-1");
    expect(record.status).toBe("completed");
  });

  it("defines valid export statuses", () => {
    const statuses: ExportStatus[] = [
      "pending",
      "completed",
      "failed",
      "rolled_back",
    ];
    statuses.forEach((status) => {
      expect(typeof status).toBe("string");
    });
  });
});
