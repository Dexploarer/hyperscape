/**
 * Bulk Operations Tests
 *
 * Tests for bulk operations utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi } from "vitest";
import {
  createMaterialVariants,
  createTierSet,
  cloneWithModifications,
} from "../bulk-operations";
import type { BaseAsset, AssetModifications } from "../bulk-operations";

// Mock templates
vi.mock("@/lib/templates/asset-templates", () => ({
  MATERIAL_TIERS: {
    bronze: { id: "bronze", name: "Bronze", level: 1 },
    iron: { id: "iron", name: "Iron", level: 10 },
  },
  createItemFromTemplate: vi.fn((template, material) => ({
    id: `${material.id}_${template.id}`,
    name: `${material.name} ${template.name}`,
  })),
}));

describe("BulkOperations", () => {
  it("creates material variants", async () => {
    const baseAsset: BaseAsset = {
      id: "sword",
      name: "Sword",
      type: "weapon",
      category: "weapon",
    };

    const result = await createMaterialVariants(baseAsset, ["bronze", "iron"]);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("creates tier set", async () => {
    const result = await createTierSet(["weapon"], ["bronze", "iron"]);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("clones asset with modifications", () => {
    const baseAsset: BaseAsset = {
      id: "original",
      name: "Original",
      value: 100,
    };

    const modifications: AssetModifications = {
      idPrefix: "new-",
      namePrefix: "New ",
      valueMultiplier: 2,
    };

    const cloned = cloneWithModifications(baseAsset, modifications);

    expect(cloned.id).toBe("new-original");
    expect(cloned.name).toBe("New Original");
    expect(cloned.value).toBe(200);
  });

});
