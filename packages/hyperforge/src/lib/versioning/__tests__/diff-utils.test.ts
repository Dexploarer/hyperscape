/**
 * Diff Utils Tests
 *
 * Tests for version diff utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  calculateDiff,
  calculateSummary,
  hashObject,
  deepClone,
} from "../diff-utils";

describe("DiffUtils", () => {
  it("calculates diff between objects", () => {
    const oldObj = { name: "Old", value: 10 };
    const newObj = { name: "New", value: 20 };

    const diff = calculateDiff(oldObj, newObj);
    expect(Array.isArray(diff)).toBe(true);
    expect(diff.length).toBeGreaterThan(0);
  });

  it("detects added fields", () => {
    const oldObj = { name: "Test" };
    const newObj = { name: "Test", value: 10 };

    const diff = calculateDiff(oldObj, newObj);
    const added = diff.filter((c) => c.type === "added");
    expect(added.length).toBeGreaterThan(0);
  });

  it("detects removed fields", () => {
    const oldObj = { name: "Test", value: 10 };
    const newObj = { name: "Test" };

    const diff = calculateDiff(oldObj, newObj);
    const deleted = diff.filter((c) => c.type === "deleted");
    expect(deleted.length).toBeGreaterThan(0);
  });

  it("detects modified fields", () => {
    const oldObj = { name: "Old", value: 10 };
    const newObj = { name: "New", value: 20 };

    const diff = calculateDiff(oldObj, newObj);
    const modified = diff.filter((c) => c.type === "modified");
    expect(modified.length).toBeGreaterThan(0);
  });

  it("calculates diff summary", () => {
    const oldObj = { name: "Old", value: 10 };
    const newObj = { name: "New", value: 20 };

    const diff = calculateDiff(oldObj, newObj);
    const summary = calculateSummary(diff);

    expect(summary).toBeDefined();
    expect(typeof summary.added).toBe("number");
    expect(typeof summary.deleted).toBe("number");
    expect(typeof summary.modified).toBe("number");
  });

  it("hashes objects consistently", () => {
    const obj = { name: "Test", value: 10 };
    const hash1 = hashObject(obj);
    const hash2 = hashObject(obj);

    expect(hash1).toBe(hash2);
  });

  it("hashes different objects differently", () => {
    const obj1 = { name: "Test1" };
    const obj2 = { name: "Test2" };

    const hash1 = hashObject(obj1);
    const hash2 = hashObject(obj2);

    expect(hash1).not.toBe(hash2);
  });

  it("deep clones objects", () => {
    const original = { name: "Test", nested: { value: 10 } };
    const cloned = deepClone(original);

    expect(cloned).not.toBe(original);
    expect(cloned.name).toBe(original.name);
    expect(cloned.nested).not.toBe(original.nested);
    expect(cloned.nested.value).toBe(original.nested.value);
  });

  it("deep clones arrays", () => {
    const original = [{ id: 1 }, { id: 2 }];
    const cloned = deepClone(original);

    expect(cloned).not.toBe(original);
    expect(cloned.length).toBe(original.length);
    expect(cloned[0]).not.toBe(original[0]);
  });
});
