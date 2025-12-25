/**
 * Assets Registry API Route Tests
 *
 * Tests for /api/assets/registry route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// Mock dependencies
vi.mock("@/lib/assets", () => ({
  getAllAssets: vi.fn().mockResolvedValue([]),
  getAssetsByCategory: vi.fn().mockResolvedValue([]),
  getAssetsBySource: vi.fn().mockResolvedValue([]),
  getAssetsByType: vi.fn().mockResolvedValue([]),
  searchAssets: vi.fn().mockResolvedValue([]),
  getModelAssets: vi.fn().mockResolvedValue([]),
  getAudioAssets: vi.fn().mockResolvedValue([]),
  getRegistryStats: vi.fn().mockResolvedValue({
    total: 0,
    bySource: { CDN: 0, FORGE: 0, LOCAL: 0 },
    byCategory: {},
  }),
  invalidateRegistryCache: vi.fn(),
}));

describe("API Route: /api/assets/registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/registry", () => {
    it("returns registry stats when no query params", async () => {
      const { getRegistryStats } = await import("@/lib/assets");
      vi.mocked(getRegistryStats).mockResolvedValue({
        total: 100,
        bySource: { CDN: 50, FORGE: 40, LOCAL: 10 },
        byCategory: { weapon: 20, armor: 15 },
      });

      const request = new NextRequest("https://example.com/api/assets/registry");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.total).toBe(100);
      expect(body.usage).toBeDefined();
    });

    it("returns all assets when all=true", async () => {
      const { getAllAssets } = await import("@/lib/assets");
      vi.mocked(getAllAssets).mockResolvedValue([
        { id: "asset-1", name: "Asset 1", source: "FORGE" },
        { id: "asset-2", name: "Asset 2", source: "CDN" },
      ]);

      const request = new NextRequest("https://example.com/api/assets/registry?all=true");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.assets).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it("filters by type", async () => {
      const { getModelAssets } = await import("@/lib/assets");
      vi.mocked(getModelAssets).mockResolvedValue([
        { id: "model-1", name: "Model 1", type: "model" },
      ]);

      const request = new NextRequest("https://example.com/api/assets/registry?type=model");
      const response = await GET(request);

      expect(getModelAssets).toHaveBeenCalled();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it("filters by source", async () => {
      const { getAssetsBySource } = await import("@/lib/assets");
      vi.mocked(getAssetsBySource).mockResolvedValue([
        { id: "forge-1", name: "Forge Asset", source: "FORGE" },
      ]);

      const request = new NextRequest("https://example.com/api/assets/registry?source=FORGE");
      const response = await GET(request);

      expect(getAssetsBySource).toHaveBeenCalledWith("FORGE");
      expect(response.status).toBe(200);
    });

    it("filters by category", async () => {
      const { getAssetsByCategory } = await import("@/lib/assets");
      vi.mocked(getAssetsByCategory).mockResolvedValue([
        { id: "weapon-1", name: "Sword", category: "weapon" },
      ]);

      const request = new NextRequest("https://example.com/api/assets/registry?category=weapon");
      const response = await GET(request);

      expect(getAssetsByCategory).toHaveBeenCalledWith("weapon");
      expect(response.status).toBe(200);
    });

    it("searches assets", async () => {
      const { searchAssets } = await import("@/lib/assets");
      vi.mocked(searchAssets).mockResolvedValue([
        { id: "sword-1", name: "Iron Sword", source: "FORGE" },
      ]);

      const request = new NextRequest("https://example.com/api/assets/registry?search=sword");
      const response = await GET(request);

      expect(searchAssets).toHaveBeenCalledWith("sword");
      expect(response.status).toBe(200);
    });

    it("handles pagination", async () => {
      const { getAllAssets } = await import("@/lib/assets");
      const mockAssets = Array.from({ length: 50 }, (_, i) => ({
        id: `asset-${i}`,
        name: `Asset ${i}`,
        source: "FORGE" as const,
      }));
      vi.mocked(getAllAssets).mockResolvedValue(mockAssets);

      const request = new NextRequest(
        "https://example.com/api/assets/registry?limit=10&offset=20",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.assets).toHaveLength(10);
      expect(body.total).toBe(50);
      expect(body.returned).toBe(10);
    });

    it("invalidates cache when reload=true", async () => {
      const { invalidateRegistryCache } = await import("@/lib/assets");
      vi.mocked(invalidateRegistryCache).mockReturnValue(undefined);

      const request = new NextRequest("https://example.com/api/assets/registry?reload=true");
      const response = await GET(request);

      expect(invalidateRegistryCache).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("validates query parameters", async () => {
      const request = new NextRequest(
        "https://example.com/api/assets/registry?hasVRM=invalid",
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe("POST /api/assets/registry", () => {
    it("forces registry reload", async () => {
      const { invalidateRegistryCache, getRegistryStats } = await import("@/lib/assets");
      vi.mocked(invalidateRegistryCache).mockReturnValue(undefined);
      vi.mocked(getRegistryStats).mockResolvedValue({
        total: 100,
        bySource: { CDN: 50, FORGE: 40, LOCAL: 10 },
        byCategory: {},
      });

      const request = new NextRequest("https://example.com/api/assets/registry", {
        method: "POST",
      });
      const response = await POST(request);

      expect(invalidateRegistryCache).toHaveBeenCalled();
      expect(getRegistryStats).toHaveBeenCalled();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain("invalidated");
    });

    it("handles reload errors", async () => {
      const { invalidateRegistryCache, getRegistryStats } = await import("@/lib/assets");
      vi.mocked(invalidateRegistryCache).mockReturnValue(undefined);
      vi.mocked(getRegistryStats).mockRejectedValue(new Error("Stats error"));

      const request = new NextRequest("https://example.com/api/assets/registry", {
        method: "POST",
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });
});
