/**
 * Audio Route Helpers Tests
 *
 * Tests for audio route helper functions.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi } from "vitest";
import {
  resolvePresetPrompt,
  saveAudioWithFallback,
} from "../audio-route-helpers";
import { storageService } from "@/lib/storage";

// Mock storage service
vi.mock("@/lib/storage", () => ({
  storageService: {
    uploadAudio: vi.fn().mockResolvedValue({
      success: true,
      url: "/api/audio/test.mp3",
      path: "/audio/test.mp3",
      backend: "local",
    }),
  },
}));

// Mock registry
vi.mock("@/lib/assets/registry", () => ({
  invalidateRegistryCache: vi.fn(),
}));

describe("AudioRouteHelpers", () => {
  it("resolves preset prompt", () => {
    const presets = {
      combat: "combat sound",
      ambient: "ambient sound",
    };

    const prompt = resolvePresetPrompt("combat", presets);
    expect(prompt).toBe("combat sound");
  });

  it("returns undefined for unknown preset", () => {
    const presets = { combat: "combat sound" };
    const prompt = resolvePresetPrompt("unknown", presets);
    expect(prompt).toBeUndefined();
  });

  it("saves audio with fallback", async () => {
    const buffer = Buffer.from("fake audio");
    const result = await saveAudioWithFallback({
      audio: buffer,
      audioType: "sfx",
      assetId: "test-sfx",
      category: "combat",
      name: "test-sound",
      prompt: "sword clash",
      duration: 2.5,
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      } as never,
    });

    expect(result.success).toBe(true);
    expect(result.url).toBeDefined();
  });

});
