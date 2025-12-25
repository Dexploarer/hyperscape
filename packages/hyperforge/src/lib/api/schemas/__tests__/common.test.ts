/**
 * Common Schemas Tests
 *
 * Tests for common Zod schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  Vector3Schema,
  Vector3RequiredSchema,
  AssetCategorySchema,
  RaritySchema,
  AssetSourceSchema,
  EquipSlotSchema,
  WeaponTypeSchema,
  AttackTypeSchema,
  CombatBonusesSchema,
  RequirementsSchema,
  CDNAssetBaseSchema,
  CDNAssetSchema,
  createApiResponse,
  createApiError,
  validationErrorResponse,
} from "../common";
import { z } from "zod";

describe("CommonSchemas", () => {
  it("validates Vector3", () => {
    const result = Vector3Schema.safeParse({ x: 1, y: 2, z: 3 });
    expect(result.success).toBe(true);
  });

  it("validates required Vector3", () => {
    const result = Vector3RequiredSchema.safeParse({ x: 1, y: 2, z: 3 });
    expect(result.success).toBe(true);
  });

  it("rejects invalid Vector3", () => {
    const result = Vector3RequiredSchema.safeParse({ x: 1 });
    expect(result.success).toBe(false);
  });

  it("validates asset category", () => {
    const result = AssetCategorySchema.safeParse("weapon");
    expect(result.success).toBe(true);
  });

  it("rejects invalid asset category", () => {
    const result = AssetCategorySchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });

  it("validates rarity", () => {
    const result = RaritySchema.safeParse("common");
    expect(result.success).toBe(true);
  });

  it("validates asset source", () => {
    const result = AssetSourceSchema.safeParse("CDN");
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

  it("validates CDN asset base", () => {
    const result = CDNAssetBaseSchema.safeParse({
      id: "test-item",
      name: "Test Item",
      category: "weapon",
    });
    expect(result.success).toBe(true);
  });

  it("validates full CDN asset", () => {
    const result = CDNAssetSchema.safeParse({
      id: "test-item",
      name: "Test Item",
      category: "weapon",
      value: 100,
      bonuses: { attack: 10 },
    });
    expect(result.success).toBe(true);
  });

  it("creates API success response", () => {
    const response = createApiResponse({ id: "test" });
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: "test" });
  });

  it("creates API error response", () => {
    const response = createApiError("TEST_ERROR", "Test error message");
    expect(response.success).toBe(false);
    expect(response.error.code).toBe("TEST_ERROR");
    expect(response.error.message).toBe("Test error message");
  });

  it("creates validation error response", () => {
    const error = z.object({ name: z.string() }).safeParse({});
    if (!error.success) {
      const response = validationErrorResponse(error.error);
      expect(response.error).toBe("Invalid request");
      expect(response.details).toBeDefined();
    }
  });
});
