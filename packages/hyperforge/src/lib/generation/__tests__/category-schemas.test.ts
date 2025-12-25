/**
 * Category Schemas Tests
 *
 * Tests for category schema validators.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  ItemSchema,
  NPCSchema,
  ResourceSchema,
  validateAsset,
  generateAssetId,
  getDefaultMetadata,
} from "../category-schemas";

describe("CategorySchemas", () => {
  it("validates item schema", () => {
    const result = ItemSchema.safeParse({
      id: "test-item",
      name: "Test Item",
      type: "weapon",
    });
    expect(result.success).toBe(true);
  });

  it("validates NPC schema", () => {
    const result = NPCSchema.safeParse({
      id: "test-npc",
      name: "Test NPC",
      description: "A test NPC",
      category: "mob",
    });
    expect(result.success).toBe(true);
  });

  it("validates resource schema", () => {
    const result = ResourceSchema.safeParse({
      id: "test-resource",
      name: "Test Resource",
      type: "tree",
      harvestSkill: "woodcutting",
      levelRequired: 1,
    });
    expect(result.success).toBe(true);
  });

  it("validates asset against category", () => {
    const result = validateAsset("weapon", {
      id: "test-sword",
      name: "Test Sword",
      type: "weapon",
    });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("returns errors for invalid asset", () => {
    const result = validateAsset("weapon", {});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("generates asset ID from name and category", () => {
    const id = generateAssetId("Bronze Sword", "weapon");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("gets default metadata for category", () => {
    const defaults = getDefaultMetadata("weapon");
    expect(typeof defaults).toBe("object");
  });
});
