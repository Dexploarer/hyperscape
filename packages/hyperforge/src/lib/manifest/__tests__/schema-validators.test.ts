/**
 * Schema Validators Tests
 *
 * Tests for manifest schema validation.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  validateItem,
  validateNPC,
  validateResource,
} from "../schema-validators";

describe("SchemaValidators", () => {
  it("validates item with all required fields", () => {
    const item = {
      id: "test_item",
      name: "Test Item",
      type: "weapon",
      description: "A test item",
      examine: "A test item",
      tradeable: true,
      rarity: "common",
      weaponType: "sword",
      attackType: "melee",
      attackSpeed: 4,
    };

    const result = validateItem(item);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("returns errors for missing required fields", () => {
    const item = {};

    const result = validateItem(item);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validates ID format", () => {
    const item = {
      id: "Invalid-ID",
      name: "Test",
      type: "weapon",
      description: "Test",
      examine: "Test",
      tradeable: true,
      rarity: "common",
    };

    const result = validateItem(item);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("ID"))).toBe(true);
  });

  it("validates NPC with all required fields", () => {
    const npc = {
      id: "test_npc",
      name: "Test NPC",
      description: "A test NPC",
      category: "mob",
    };

    const result = validateNPC(npc);
    expect(result.valid).toBe(true);
  });

  it("validates resource", () => {
    const resource = {
      id: "test_resource",
      name: "Test Resource",
      type: "tree",
    };

    const result = validateResource(resource);
    expect(result.valid).toBe(true);
  });
});
