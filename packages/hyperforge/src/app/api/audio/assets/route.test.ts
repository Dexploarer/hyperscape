/**
 * Audio Assets API Route Tests
 *
 * Tests for /api/audio/assets route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

// Mock dependencies
vi.mock("@/lib/storage/supabase-storage", () => ({
  listAudioAssets: vi.fn().mockResolvedValue([]),
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/cdn/loader", () => ({
  loadCDNAssets: vi.fn().mockResolvedValue([]),
}));

vi.mock("fs", () => ({
  promises: {
    access: vi.fn(),
    readdir: vi.fn().mockResolvedValue([]),
    stat: vi.fn(),
  },
}));

describe("API Route: /api/audio/assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/audio/assets", () => {
    it("returns audio assets from all sources", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      const { listAudioAssets } = await import("@/lib/storage/supabase-storage");

      vi.mocked(loadCDNAssets).mockResolvedValue([
        {
          id: "music-1",
          name: "Battle Music",
          category: "music",
          modelPath: "audio/music/battle.mp3",
          type: "music",
          description: "Epic battle music",
        },
      ]);

      vi.mocked(listAudioAssets).mockResolvedValue([
        {
          id: "voice-1",
          filename: "voice_1.mp3",
          type: "voice",
          url: "/api/audio/file/voice/voice_1.mp3",
          createdAt: new Date().toISOString(),
          size: 2048,
        },
      ]);

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it("handles CDN load failure gracefully", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      vi.mocked(loadCDNAssets).mockRejectedValue(new Error("CDN error"));

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it("handles Supabase load failure gracefully", async () => {
      const { listAudioAssets } = await import("@/lib/storage/supabase-storage");
      vi.mocked(listAudioAssets).mockRejectedValue(new Error("Supabase error"));

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
