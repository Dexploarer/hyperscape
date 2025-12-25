/**
 * AI Providers Tests
 *
 * Tests for AI provider configurations.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  PROVIDER_MODELS,
  IMAGE_MODELS,
  getImageModelConfig,
  isMultimodalImageModel,
  getTaskModel,
} from "../providers";

describe("AIProviders", () => {
  it("exports provider models", () => {
    expect(PROVIDER_MODELS).toBeDefined();
    expect(PROVIDER_MODELS.openai).toBeDefined();
    expect(PROVIDER_MODELS.anthropic).toBeDefined();
    expect(PROVIDER_MODELS.google).toBeDefined();
  });

  it("exports image models", () => {
    expect(IMAGE_MODELS).toBeDefined();
    expect(Array.isArray(IMAGE_MODELS)).toBe(true);
    expect(IMAGE_MODELS.length).toBeGreaterThan(0);
  });

  it("gets image model config by ID", () => {
    const config = getImageModelConfig("bfl/flux-2-pro");
    expect(config).toBeDefined();
    expect(config?.id).toBe("bfl/flux-2-pro");
  });

  it("returns undefined for unknown model", () => {
    const config = getImageModelConfig("unknown/model");
    expect(config).toBeUndefined();
  });

  it("checks if model is multimodal", () => {
    expect(isMultimodalImageModel("google/gemini-2.5-flash-image")).toBe(true);
    expect(isMultimodalImageModel("bfl/flux-2-pro")).toBe(false);
  });

  it("gets task model", () => {
    const model = getTaskModel("textGeneration");
    expect(typeof model).toBe("string");
    expect(model.length).toBeGreaterThan(0);
  });
});
