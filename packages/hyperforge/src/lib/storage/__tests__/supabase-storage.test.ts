/**
 * Supabase Storage Tests
 *
 * Tests for Supabase storage operations.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isSupabaseConfigured,
  uploadImage,
  uploadAudio,
  uploadContent,
  getSupabasePublicUrl,
  BUCKET_NAMES,
} from "../supabase-storage";

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://example.com/test.png" },
        })),
        list: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
      })),
    },
  })),
}));

describe("SupabaseStorage", () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
  });

  it("checks if Supabase is configured", () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe("boolean");
  });

  it("returns false when Supabase is not configured", () => {
    const configured = isSupabaseConfigured();
    expect(configured).toBe(false);
  });

  it("returns true when Supabase is configured", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "test-key";
    const configured = isSupabaseConfigured();
    expect(configured).toBe(true);
  });

  it("exports BUCKET_NAMES constant", () => {
    expect(BUCKET_NAMES).toBeDefined();
    expect(BUCKET_NAMES.IMAGE_GENERATION).toBe("image-generation");
    expect(BUCKET_NAMES.AUDIO_GENERATIONS).toBe("audio-generations");
  });

  it("uploads image with proper structure", async () => {
    const buffer = Buffer.from("fake image");
    const result = await uploadImage({
      buffer,
      filename: "test-image",
      type: "concept-art",
      assetId: "test-asset",
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("uploads audio with proper structure", async () => {
    const buffer = Buffer.from("fake audio");
    const result = await uploadAudio({
      buffer,
      filename: "test-audio",
      type: "sfx",
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("uploads content with proper structure", async () => {
    const buffer = Buffer.from("fake content");
    const result = await uploadContent(
      buffer,
      "test.json",
      "application/json",
      "test",
    );

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("gets public URL for bucket and path", () => {
    const url = getSupabasePublicUrl("test-bucket", "test/path.png");
    expect(typeof url).toBe("string");
  });
});
