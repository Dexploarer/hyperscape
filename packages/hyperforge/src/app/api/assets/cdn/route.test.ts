/**
 * Assets CDN API Route Tests
 *
 * Tests for /api/assets/cdn route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

// Mock dependencies
vi.mock("@/lib/cdn/loader", () => ({
  loadCDNAssets: vi.fn().mockResolvedValue([]),
}));

describe("API Route: /api/assets/cdn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/cdn", () => {
    it("returns CDN assets filtered to 3D models only", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      vi.mocked(loadCDNAssets).mockResolvedValue([
        {
          id: "item-1",
          name: "Iron Sword",
          category: "weapon",
          modelPath: "items/sword.glb",
          type: "sword",
        },
        {
          id: "music-1",
          name: "Battle Music",
          category: "music",
          modelPath: "audio/battle.mp3",
          type: "music",
        },
      ]);

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      // Should filter out music assets
      expect(body.every((a: { category: string }) => a.category !== "music")).toBe(true);
    });

    it("filters out audio file types", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      vi.mocked(loadCDNAssets).mockResolvedValue([
        {
          id: "item-1",
          name: "Sword",
          category: "weapon",
          modelPath: "items/sword.glb",
          type: "sword",
        },
        {
          id: "audio-1",
          name: "Sound",
          category: "item",
          modelPath: "audio/sound.mp3",
          type: "audio",
        },
      ]);

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      // Should filter out .mp3 files
      expect(body.every((a: { modelPath?: string }) => !a.modelPath?.endsWith(".mp3"))).toBe(
        true,
      );
    });

    it("handles load failure gracefully", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      vi.mocked(loadCDNAssets).mockRejectedValue(new Error("CDN error"));

      const response = await GET();

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });
});
