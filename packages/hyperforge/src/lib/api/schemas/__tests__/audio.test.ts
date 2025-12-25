/**
 * Audio Schemas Tests
 *
 * Tests for audio API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  AudioAssetsQuerySchema,
  VoicesQuerySchema,
  VoiceGenerationSchema,
  SFXGenerationSchema,
  MusicGenerationSchema,
} from "../audio";

describe("AudioSchemas", () => {
  it("validates audio assets query", () => {
    const result = AudioAssetsQuerySchema.safeParse({
      type: "voice",
      source: "FORGE",
    });
    expect(result.success).toBe(true);
  });

  it("validates voices query", () => {
    const result = VoicesQuerySchema.safeParse({
      type: "search",
      search: "merchant",
    });
    expect(result.success).toBe(true);
  });

  it("validates voice generation", () => {
    const result = VoiceGenerationSchema.safeParse({
      text: "Hello world",
      voiceId: "voice-123",
    });
    expect(result.success).toBe(true);
  });

  it("validates voice generation with preset", () => {
    const result = VoiceGenerationSchema.safeParse({
      text: "Hello world",
      voicePreset: "merchant",
    });
    expect(result.success).toBe(true);
  });

  it("validates SFX generation", () => {
    const result = SFXGenerationSchema.safeParse({
      prompt: "sword clash",
      category: "combat",
    });
    expect(result.success).toBe(true);
  });

  it("validates music generation", () => {
    const result = MusicGenerationSchema.safeParse({
      prompt: "epic battle theme",
      category: "combat",
    });
    expect(result.success).toBe(true);
  });
});
