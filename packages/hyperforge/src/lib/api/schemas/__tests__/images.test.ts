/**
 * Images Schemas Tests
 *
 * Tests for image API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  ImageTypeSchema,
  SpriteStyleSchema,
  SpriteViewSchema,
  ImageGenerateSchema,
  SpriteGenerateSchema,
  ImageQuerySchema,
} from "../images";

describe("ImagesSchemas", () => {
  it("validates image type", () => {
    const result = ImageTypeSchema.safeParse("concept-art");
    expect(result.success).toBe(true);
  });

  it("validates sprite style", () => {
    const result = SpriteStyleSchema.safeParse("pixel");
    expect(result.success).toBe(true);
  });

  it("validates sprite view", () => {
    const result = SpriteViewSchema.safeParse("front");
    expect(result.success).toBe(true);
  });

  it("validates image generation", () => {
    const result = ImageGenerateSchema.safeParse({
      type: "concept-art",
      prompt: "A bronze sword",
    });
    expect(result.success).toBe(true);
  });

  it("validates sprite generation", () => {
    const result = SpriteGenerateSchema.safeParse({
      assetId: "test-asset",
      assetName: "Test Asset",
    });
    expect(result.success).toBe(true);
  });

  it("validates image query", () => {
    const result = ImageQuerySchema.safeParse({
      assetId: "test-asset",
      type: "concept-art",
      source: "FORGE",
    });
    expect(result.success).toBe(true);
  });
});
