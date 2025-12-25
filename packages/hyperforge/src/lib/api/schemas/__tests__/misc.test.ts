/**
 * Misc Schemas Tests
 *
 * Tests for miscellaneous API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  MaterialTierIdSchema,
  BulkVariantActionSchema,
  BulkVariantsRequestSchema,
  AIGenerateRequestSchema,
} from "../misc";

describe("MiscSchemas", () => {
  it("validates material tier ID", () => {
    const result = MaterialTierIdSchema.safeParse("bronze");
    expect(result.success).toBe(true);
  });

  it("validates bulk variant action", () => {
    const result = BulkVariantActionSchema.safeParse("create_variants");
    expect(result.success).toBe(true);
  });

  it("validates bulk variants request", () => {
    const result = BulkVariantsRequestSchema.safeParse({
      action: "create_variants",
      baseAsset: {
        id: "sword-base",
        name: "Sword",
      },
      materials: ["bronze", "iron"],
    });
    expect(result.success).toBe(true);
  });

  it("validates AI generate request", () => {
    const result = AIGenerateRequestSchema.safeParse({
      type: "text",
      prompt: "Generate text",
      provider: "openai/gpt-4o",
    });
    expect(result.success).toBe(true);
  });
});
