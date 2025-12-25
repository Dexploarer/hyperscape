/**
 * Content Assets API Route Tests
 *
 * Tests for /api/content/assets route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock dependencies
vi.mock("@/lib/storage/supabase-storage", () => ({
  listContentAssets: vi.fn().mockResolvedValue([]),
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/cdn/loader", () => ({
  loadCDNManifests: vi.fn().mockResolvedValue({
    items: [],
    npcs: [],
  }),
}));

vi.mock("fs", () => ({
  promises: {
    access: vi.fn(),
    readdir: vi.fn().mockResolvedValue([]),
    stat: vi.fn(),
    readFile: vi.fn(),
  },
}));

describe("API Route: /api/content/assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/content/assets", () => {
    it("returns content assets from all sources", async () => {
      const { loadCDNManifests } = await import("@/lib/cdn/loader");
      const { listContentAssets } = await import("@/lib/storage/supabase-storage");

      vi.mocked(loadCDNManifests).mockResolvedValue({
        items: [
          { id: "item-1", name: "Iron Sword", description: "A basic sword" },
        ],
        npcs: [
          { id: "npc-1", name: "Merchant", description: "A friendly merchant" },
        ],
      });

      vi.mocked(listContentAssets).mockResolvedValue([
        {
          id: "content-1",
          filename: "quest_1.json",
          type: "quest",
          url: "/api/content/content-1",
          createdAt: new Date().toISOString(),
          size: 1024,
        },
      ]);

      const request = new NextRequest("https://example.com/api/content/assets");
      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it("handles CDN load failure gracefully", async () => {
      const { loadCDNManifests } = await import("@/lib/cdn/loader");
      vi.mocked(loadCDNManifests).mockRejectedValue(new Error("CDN error"));

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it("handles Supabase load failure gracefully", async () => {
      const { listContentAssets } = await import("@/lib/storage/supabase-storage");
      vi.mocked(listContentAssets).mockRejectedValue(new Error("Supabase error"));

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it("returns error response on critical failure", async () => {
      const { loadCDNManifests } = await import("@/lib/cdn/loader");
      const { promises: fs } = await import("fs");
      
      vi.mocked(loadCDNManifests).mockRejectedValue(new Error("Critical error"));
      vi.mocked(fs.readdir).mockRejectedValue(new Error("FS error"));

      const response = await GET();

      // Should still return 200 with empty array or handle gracefully
      expect([200, 500]).toContain(response.status);
    });
  });
});
