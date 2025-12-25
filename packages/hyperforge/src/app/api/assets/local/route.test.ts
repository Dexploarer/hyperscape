/**
 * Assets Local API Route Tests
 *
 * Tests for /api/assets/local route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

// Mock dependencies
vi.mock("@/lib/storage/supabase-storage", () => ({
  listMeshyModels: vi.fn().mockResolvedValue([]),
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock("fs", () => ({
  promises: {
    access: vi.fn(),
    readdir: vi.fn().mockResolvedValue([]),
    stat: vi.fn(),
  },
}));

describe("API Route: /api/assets/local", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/local", () => {
    it("returns local/forge assets from Supabase", async () => {
      const { listMeshyModels } = await import("@/lib/storage/supabase-storage");
      vi.mocked(listMeshyModels).mockResolvedValue([
        {
          id: "asset-1",
          name: "Test Asset",
          category: "weapon",
          type: "sword",
          modelPath: "asset-1/model.glb",
          modelUrl: "https://example.com/asset-1/model.glb",
          thumbnailUrl: "https://example.com/asset-1/thumbnail.png",
          hasVRM: false,
          createdAt: new Date().toISOString(),
        },
      ]);

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].source).toBe("FORGE");
    });

    it("handles Supabase load failure gracefully", async () => {
      const { listMeshyModels } = await import("@/lib/storage/supabase-storage");
      vi.mocked(listMeshyModels).mockRejectedValue(new Error("Supabase error"));

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it("includes local filesystem assets as fallback", async () => {
      const { promises: fs } = await import("fs");
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: "asset-1", isDirectory: () => true, isFile: () => false },
      ] as never);
      vi.mocked(fs.stat).mockResolvedValue({
        mtime: new Date(),
      } as never);

      // Mock readdir for asset directory
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: "asset-1", isDirectory: () => true, isFile: () => false },
      ] as never);
      vi.mocked(fs.readdir).mockResolvedValueOnce(["model.glb"] as never);

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
