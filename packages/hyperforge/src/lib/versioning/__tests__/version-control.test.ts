/**
 * Version Control Tests
 *
 * Tests for version control service.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSnapshot,
  getSnapshot,
  listSnapshots,
  deleteSnapshot,
  compareSnapshots,
  getAssetHistory,
} from "../version-control";
import { promises as fs } from "fs";
import path from "path";

// Mock versions directory
const TEST_VERSIONS_DIR = path.join(process.cwd(), ".test-versions");

vi.mock("../version-control", async () => {
  const actual = await vi.importActual("../version-control");
  return {
    ...actual,
    // Override VERSIONS_DIR for tests
  };
});

// Set environment variable for test
process.env.HYPERFORGE_VERSIONS_DIR = TEST_VERSIONS_DIR;

describe("VersionControl", () => {
  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_VERSIONS_DIR, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist
    }
  });

  it("creates snapshot", async () => {
    const snapshot = await createSnapshot({
      items: [],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    }, "Test snapshot");

    expect(snapshot).toBeDefined();
    expect(snapshot.id).toBeDefined();
    expect(snapshot.description).toBe("Test snapshot");
  });

  it("gets snapshot", async () => {
    const created = await createSnapshot({
      items: [],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    }, "Test");

    const snapshot = await getSnapshot(created.id);
    expect(snapshot).toBeDefined();
    expect(snapshot?.id).toBe(created.id);
  });

  it("lists snapshots", async () => {
    await createSnapshot({
      items: [],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    }, "Test 1");

    await createSnapshot({
      items: [],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    }, "Test 2");

    const snapshots = await listSnapshots();
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
  });

  it("deletes snapshot", async () => {
    const snapshot = await createSnapshot({
      items: [],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    }, "Test");

    const deleted = await deleteSnapshot(snapshot.id);
    expect(deleted).toBe(true);

    const retrieved = await getSnapshot(snapshot.id);
    expect(retrieved).toBeNull();
  });

  it("compares snapshots", async () => {
    const snapshot1 = await createSnapshot({
      items: [{ id: "item1", name: "Item 1" } as never],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    }, "Snapshot 1");

    const snapshot2 = await createSnapshot({
      items: [{ id: "item1", name: "Item 1 Updated" } as never],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    }, "Snapshot 2");

    const diff = await compareSnapshots(snapshot1.id, snapshot2.id);
    expect(diff).toBeDefined();
    if (diff) {
      expect(diff.fromSnapshotId).toBe(snapshot1.id);
      expect(diff.toSnapshotId).toBe(snapshot2.id);
    }
  });

  it("gets asset history", async () => {
    await createSnapshot({
      items: [{ id: "item1", name: "Item 1" } as never],
      npcs: [],
      resources: [],
      stores: [],
      music: [],
    }, "Snapshot 1");

    const history = await getAssetHistory("item1", "items");
    expect(Array.isArray(history)).toBe(true);
  });

});
