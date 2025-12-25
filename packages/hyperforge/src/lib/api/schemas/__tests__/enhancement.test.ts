/**
 * Enhancement Schemas Tests
 *
 * Tests for enhancement API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  EnhancementActionSchema,
  EnhancementRequestSchema,
  VariantRequestSchema,
  VariantStatusSchema,
} from "../enhancement";

describe("EnhancementSchemas", () => {
  it("validates enhancement action", () => {
    const result = EnhancementActionSchema.safeParse("retexture");
    expect(result.success).toBe(true);
  });

  it("validates enhancement request with retexture", () => {
    const result = EnhancementRequestSchema.safeParse({
      action: "retexture",
      assetId: "test-asset",
      styleType: "text",
      textPrompt: "bronze texture",
    });
    expect(result.success).toBe(true);
  });

  it("validates enhancement request with regenerate", () => {
    const result = EnhancementRequestSchema.safeParse({
      action: "regenerate",
      assetId: "test-asset",
      prompt: "A bronze sword",
    });
    expect(result.success).toBe(true);
  });

  it("validates variant status", () => {
    const result = VariantStatusSchema.safeParse("completed");
    expect(result.success).toBe(true);
  });

  it("validates variant request with create action", () => {
    const result = VariantRequestSchema.safeParse({
      action: "create",
      baseModelId: "sword-base",
      baseModelUrl: "https://example.com/sword.glb",
      variant: {
        name: "Bronze Sword",
        prompt: "bronze texture",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates variant request with list action", () => {
    const result = VariantRequestSchema.safeParse({
      action: "list",
      baseModelId: "sword-base",
    });
    expect(result.success).toBe(true);
  });
});
