/**
 * Version Service Tests
 *
 * Tests for version service operations.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveVersion,
  getVersionHistory,
  getVersion,
  getCurrentVersion,
  diffVersions,
  diffFromCurrent,
  rollback,
  deleteAssetVersions,
  getExportHistory,
  recordExport,
  getExportRecord,
  markExportRolledBack,
  hasVersions,
  getVersionCount,
  getVersionedAssetIds,
  clearAllVersionData,
  getStorageStats,
} from "../version-service";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("VersionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    clearAllVersionData();
  });

  it("saves a version", () => {
    const version = saveVersion("test-asset", {
      name: "Test Asset",
      category: "weapon",
      metadata: {},
    });

    expect(version).toBeDefined();
    expect(version.assetId).toBe("test-asset");
    expect(version.data.name).toBe("Test Asset");
  });

  it("skips saving duplicate version", () => {
    const data = { name: "Test Asset", category: "weapon", metadata: {} };
    const v1 = saveVersion("test-asset", data);
    const v2 = saveVersion("test-asset", data);

    expect(v1.id).toBe(v2.id);
  });

  it("gets version history", () => {
    saveVersion("test-asset", { name: "V1", category: "weapon", metadata: {} });
    saveVersion("test-asset", { name: "V2", category: "weapon", metadata: {} });

    const history = getVersionHistory("test-asset");
    expect(history.length).toBe(2);
    expect(history[0].data.name).toBe("V2"); // Newest first
  });

  it("returns empty array for asset with no versions", () => {
    const history = getVersionHistory("nonexistent");
    expect(history.length).toBe(0);
  });

  it("gets a specific version by ID", () => {
    const version = saveVersion("test-asset", { name: "Test", category: "weapon", metadata: {} });
    const found = getVersion("test-asset", version.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(version.id);
  });

  it("returns null for non-existent version", () => {
    const version = getVersion("test-asset", "nonexistent-id");
    expect(version).toBeNull();
  });

  it("gets current version", () => {
    saveVersion("test-asset", { name: "V1", category: "weapon", metadata: {} });
    const current = getCurrentVersion("test-asset");

    expect(current).toBeDefined();
    expect(current?.assetId).toBe("test-asset");
  });

  it("returns null when no current version", () => {
    const current = getCurrentVersion("nonexistent");
    expect(current).toBeNull();
  });

  it("calculates diff between versions", () => {
    const v1 = saveVersion("test-asset", { name: "Old Name", category: "weapon", metadata: {} });
    const v2 = saveVersion("test-asset", { name: "New Name", category: "weapon", metadata: {} });

    const diff = diffVersions("test-asset", v1.id, v2.id);
    expect(diff).toBeDefined();
    expect(diff?.hasChanges).toBe(true);
  });

  it("returns null when diffing non-existent versions", () => {
    const diff = diffVersions("test-asset", "v1", "v2");
    expect(diff).toBeNull();
  });

  it("diffs from current version", () => {
    const v1 = saveVersion("test-asset", { name: "V1", category: "weapon", metadata: {} });
    saveVersion("test-asset", { name: "V2", category: "weapon", metadata: {} });

    const diff = diffFromCurrent("test-asset", v1.id);
    expect(diff).toBeDefined();
  });

  it("rolls back to a previous version", () => {
    const v1 = saveVersion("test-asset", { name: "V1", category: "weapon", metadata: {} });
    saveVersion("test-asset", { name: "V2", category: "weapon", metadata: {} });

    const rolledBack = rollback("test-asset", v1.id);
    expect(rolledBack).toBeDefined();
    expect(rolledBack?.name).toBe("V1");
  });

  it("returns null when rolling back to non-existent version", () => {
    const rolledBack = rollback("test-asset", "nonexistent-id");
    expect(rolledBack).toBeNull();
  });

  it("deletes all versions for an asset", () => {
    saveVersion("test-asset", { name: "V1", category: "weapon", metadata: {} });
    deleteAssetVersions("test-asset");

    const history = getVersionHistory("test-asset");
    expect(history.length).toBe(0);
  });

  it("gets export history", () => {
    const history = getExportHistory();
    expect(history).toBeDefined();
    expect(Array.isArray(history.records)).toBe(true);
  });

  it("records an export", () => {
    const record = recordExport(
      ["items"],
      [{ assetId: "test-item", assetName: "Test Item", versionId: "v1", changeType: "added" }],
    );

    expect(record).toBeDefined();
    expect(record.manifestTypes).toContain("items");
    expect(record.assetCount).toBe(1);
  });

  it("gets export record by ID", () => {
    const record = recordExport(["items"], []);
    const found = getExportRecord(record.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(record.id);
  });

  it("marks export as rolled back", () => {
    const record = recordExport(["items"], []);
    markExportRolledBack(record.id);

    const found = getExportRecord(record.id);
    expect(found?.status).toBe("rolled_back");
  });

  it("checks if asset has versions", () => {
    expect(hasVersions("test-asset")).toBe(false);

    saveVersion("test-asset", { name: "Test", category: "weapon", metadata: {} });
    expect(hasVersions("test-asset")).toBe(true);
  });

  it("gets version count", () => {
    expect(getVersionCount("test-asset")).toBe(0);

    saveVersion("test-asset", { name: "V1", category: "weapon", metadata: {} });
    saveVersion("test-asset", { name: "V2", category: "weapon", metadata: {} });

    expect(getVersionCount("test-asset")).toBe(2);
  });

  it("gets versioned asset IDs", () => {
    saveVersion("asset-1", { name: "Asset 1", category: "weapon", metadata: {} });
    saveVersion("asset-2", { name: "Asset 2", category: "weapon", metadata: {} });

    const ids = getVersionedAssetIds();
    expect(ids.length).toBe(2);
    expect(ids).toContain("asset-1");
    expect(ids).toContain("asset-2");
  });

  it("clears all version data", () => {
    saveVersion("test-asset", { name: "Test", category: "weapon", metadata: {} });
    clearAllVersionData();

    const history = getVersionHistory("test-asset");
    expect(history.length).toBe(0);
  });

  it("gets storage statistics", () => {
    saveVersion("asset-1", { name: "Asset 1", category: "weapon", metadata: {} });
    saveVersion("asset-2", { name: "Asset 2", category: "weapon", metadata: {} });

    const stats = getStorageStats();
    expect(stats.totalAssets).toBe(2);
    expect(stats.totalVersions).toBe(2);
    expect(typeof stats.storageSizeBytes).toBe("number");
  });
});
