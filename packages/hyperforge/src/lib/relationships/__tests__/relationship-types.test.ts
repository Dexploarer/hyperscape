/**
 * Relationship Types Tests
 *
 * Tests for relationship type utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  isValidRelationship,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_VALIDATION_RULES,
  ASSET_CATEGORY_COLORS,
} from "../relationship-types";

describe("RelationshipTypes", () => {
  it("validates relationship", () => {
    const valid = isValidRelationship("drops", "mob", "weapon");

    expect(typeof valid).toBe("boolean");
  });

  it("exports relationship labels", () => {
    expect(RELATIONSHIP_LABELS).toBeDefined();
    expect(RELATIONSHIP_LABELS.drops).toBeDefined();
    expect(RELATIONSHIP_LABELS.yields).toBeDefined();
  });

  it("exports validation rules", () => {
    expect(RELATIONSHIP_VALIDATION_RULES).toBeDefined();
    expect(RELATIONSHIP_VALIDATION_RULES.drops).toBeDefined();
    expect(RELATIONSHIP_VALIDATION_RULES.drops.validSources).toContain("mob");
  });

  it("exports asset category colors", () => {
    expect(ASSET_CATEGORY_COLORS).toBeDefined();
    expect(typeof ASSET_CATEGORY_COLORS.weapon).toBe("string");
  });
});
