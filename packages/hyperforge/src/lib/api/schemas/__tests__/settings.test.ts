/**
 * Settings Schemas Tests
 *
 * Tests for settings API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  PreferenceTypeSchema,
  PreferencesQuerySchema,
  PreferencesUpdateSchema,
  AIGatewayConfigSchema,
  AIModelSchema,
  StatusResponseSchema,
} from "../settings";

describe("SettingsSchemas", () => {
  it("validates preference type", () => {
    const result = PreferenceTypeSchema.safeParse("model-preferences");
    expect(result.success).toBe(true);
  });

  it("validates preferences query", () => {
    const result = PreferencesQuerySchema.safeParse({
      type: "model-preferences",
      userId: "user-123",
    });
    expect(result.success).toBe(true);
  });

  it("validates preferences update", () => {
    const result = PreferencesUpdateSchema.safeParse({
      type: "model-preferences",
      userId: "user-123",
      data: {
        textModel: "openai/gpt-4o",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates AI gateway config", () => {
    const result = AIGatewayConfigSchema.safeParse({
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.7,
    });
    expect(result.success).toBe(true);
  });

  it("validates AI model", () => {
    const result = AIModelSchema.safeParse({
      id: "gpt-4o",
      provider: "openai",
      name: "GPT-4o",
      capabilities: ["text"],
    });
    expect(result.success).toBe(true);
  });

  it("validates status response", () => {
    const result = StatusResponseSchema.safeParse({
      meshy: { configured: true },
      openai: { configured: true },
      elevenlabs: { configured: false },
      supabase: { configured: true },
      aiGateway: { configured: true },
    });
    expect(result.success).toBe(true);
  });
});
