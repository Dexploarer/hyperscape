/**
 * CDN Schemas Tests
 *
 * Tests for CDN manifest Zod schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  RaritySchema,
  EquipSlotSchema,
  WeaponTypeSchema,
  AttackTypeSchema,
  NPCCategorySchema,
  CombatBonusesSchema,
  RequirementsSchema,
  ItemManifestSchema,
  NPCManifestSchema,
  ResourceManifestSchema,
} from "../schemas";

describe("CDNSchemas", () => {
  it("validates rarity", () => {
    const result = RaritySchema.safeParse("common");
    expect(result.success).toBe(true);
  });

  it("validates equip slot", () => {
    const result = EquipSlotSchema.safeParse("head");
    expect(result.success).toBe(true);
  });

  it("validates weapon type", () => {
    const result = WeaponTypeSchema.safeParse("sword");
    expect(result.success).toBe(true);
  });

  it("validates attack type", () => {
    const result = AttackTypeSchema.safeParse("melee");
    expect(result.success).toBe(true);
  });

  it("validates NPC category", () => {
    const result = NPCCategorySchema.safeParse("mob");
    expect(result.success).toBe(true);
  });

  it("validates combat bonuses", () => {
    const result = CombatBonusesSchema.safeParse({
      attack: 10,
      strength: 5,
    });
    expect(result.success).toBe(true);
  });

  it("validates requirements", () => {
    const result = RequirementsSchema.safeParse({
      level: 10,
      skills: { combat: 5 },
    });
    expect(result.success).toBe(true);
  });

  it("validates item manifest", () => {
    const result = ItemManifestSchema.safeParse({
      id: "test-item",
      name: "Test Item",
      type: "weapon",
    });
    expect(result.success).toBe(true);
  });

  it("validates NPC manifest", () => {
    const result = NPCManifestSchema.safeParse({
      id: "test-npc",
      name: "Test NPC",
      description: "A test NPC",
      category: "mob",
    });
    expect(result.success).toBe(true);
  });

  it("validates resource manifest", () => {
    const result = ResourceManifestSchema.safeParse({
      id: "test-resource",
      name: "Test Resource",
      type: "tree",
      harvestSkill: "woodcutting",
      levelRequired: 1,
    });
    expect(result.success).toBe(true);
  });
});
