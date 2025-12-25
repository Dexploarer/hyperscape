/**
 * Assets Unified API Route Tests
 *
 * Tests for /api/assets/unified route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "./route";

// Mock dependencies
vi.mock("@/lib/assets", () => ({
  getAllAssets: vi.fn().mockResolvedValue([]),
  getAssetById: vi.fn(),
  getAssetsByCategory: vi.fn().mockResolvedValue([]),
  getAssetsBySource: vi.fn().mockResolvedValue([]),
  getAssetsByType: vi.fn().mockResolvedValue([]),
  searchAssets: vi.fn().mockResolvedValue([]),
  getAssetModelUrl: vi.fn().mockReturnValue("/api/assets/test/model.glb"),
  getAssetThumbnailUrl: vi.fn().mockReturnValue("/api/assets/test/thumb.png"),
  getAssetVRMUrl: vi.fn().mockReturnValue(undefined),
}));

vi.mock("@/lib/relationships/relationship-service", () => ({
  addRelationship: vi.fn().mockResolvedValue({
    id: "rel-123",
    sourceId: "asset-1",
    targetId: "asset-2",
    type: "drops",
  }),
  removeRelationship: vi.fn().mockResolvedValue(true),
  getRelationships: vi.fn().mockResolvedValue([]),
}));

describe("API Route: /api/assets/unified", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/unified", () => {
    it("returns all assets when no filters", async () => {
      const { getAllAssets } = await import("@/lib/assets");
      vi.mocked(getAllAssets).mockResolvedValue([
        {
          id: "asset-1",
          name: "Test Asset",
          type: "model",
          category: "weapon",
          source: "FORGE",
          url: "/api/assets/asset-1",
        },
      ]);

      const request = new NextRequest("https://example.com/api/assets/unified");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.assets).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns single asset by id", async () => {
      const { getAssetById } = await import("@/lib/assets");
      vi.mocked(getAssetById).mockResolvedValue({
        id: "asset-123",
        name: "Test Asset",
        type: "model",
        category: "weapon",
        source: "FORGE",
        url: "/api/assets/asset-123",
      });

      const request = new NextRequest("https://example.com/api/assets/unified?id=asset-123");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.asset).toBeDefined();
      expect(body.asset.id).toBe("asset-123");
      expect(body.urls).toBeDefined();
    });

    it("returns 404 when asset not found", async () => {
      const { getAssetById } = await import("@/lib/assets");
      vi.mocked(getAssetById).mockResolvedValue(null);

      const request = new NextRequest("https://example.com/api/assets/unified?id=non-existent");
      const response = await GET(request);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("includes relationships when requested", async () => {
      const { getAssetById } = await import("@/lib/assets");
      const { getRelationships } = await import("@/lib/relationships/relationship-service");
      vi.mocked(getAssetById).mockResolvedValue({
        id: "asset-123",
        name: "Test Asset",
        type: "model",
        category: "weapon",
        source: "FORGE",
        url: "/api/assets/asset-123",
      });
      vi.mocked(getRelationships).mockResolvedValue([
        { id: "rel-1", sourceId: "asset-123", targetId: "asset-2", type: "drops" },
      ]);

      const request = new NextRequest(
        "https://example.com/api/assets/unified?id=asset-123&includeRelationships=true",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.relationships).toBeDefined();
      expect(body.relationships).toHaveLength(1);
    });

    it("filters by category", async () => {
      const { getAssetsByCategory } = await import("@/lib/assets");
      vi.mocked(getAssetsByCategory).mockResolvedValue([
        {
          id: "weapon-1",
          name: "Sword",
          type: "model",
          category: "weapon",
          source: "FORGE",
          url: "/api/assets/weapon-1",
        },
      ]);

      const request = new NextRequest("https://example.com/api/assets/unified?category=weapon");
      const response = await GET(request);

      expect(getAssetsByCategory).toHaveBeenCalledWith("weapon");
      expect(response.status).toBe(200);
    });

    it("filters by source", async () => {
      const { getAssetsBySource } = await import("@/lib/assets");
      vi.mocked(getAssetsBySource).mockResolvedValue([]);

      const request = new NextRequest("https://example.com/api/assets/unified?source=CDN");
      const response = await GET(request);

      expect(getAssetsBySource).toHaveBeenCalledWith("CDN");
      expect(response.status).toBe(200);
    });

    it("filters by type", async () => {
      const { getAssetsByType } = await import("@/lib/assets");
      vi.mocked(getAssetsByType).mockResolvedValue([]);

      const request = new NextRequest("https://example.com/api/assets/unified?type=model");
      const response = await GET(request);

      expect(getAssetsByType).toHaveBeenCalledWith("model");
      expect(response.status).toBe(200);
    });

    it("searches assets", async () => {
      const { searchAssets } = await import("@/lib/assets");
      vi.mocked(searchAssets).mockResolvedValue([]);

      const request = new NextRequest("https://example.com/api/assets/unified?search=sword");
      const response = await GET(request);

      expect(searchAssets).toHaveBeenCalledWith("sword");
      expect(response.status).toBe(200);
    });

    it("handles pagination", async () => {
      const { getAllAssets } = await import("@/lib/assets");
      const mockAssets = Array.from({ length: 50 }, (_, i) => ({
        id: `asset-${i}`,
        name: `Asset ${i}`,
        type: "model" as const,
        category: "weapon" as const,
        source: "FORGE" as const,
        url: `/api/assets/asset-${i}`,
      }));
      vi.mocked(getAllAssets).mockResolvedValue(mockAssets);

      const request = new NextRequest("https://example.com/api/assets/unified?limit=10&offset=20");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.assets).toHaveLength(10);
      expect(body.pagination.limit).toBe(10);
      expect(body.pagination.offset).toBe(20);
      expect(body.pagination.hasMore).toBe(true);
    });
  });

  describe("POST /api/assets/unified", () => {
    it("links assets with action=link", async () => {
      const { getAssetById } = await import("@/lib/assets");
      vi.mocked(getAssetById)
        .mockResolvedValueOnce({
          id: "asset-1",
          name: "Source Asset",
          category: "npc",
          type: "model",
          source: "FORGE",
          url: "/api/assets/asset-1",
        })
        .mockResolvedValueOnce({
          id: "asset-2",
          name: "Target Asset",
          category: "weapon",
          type: "model",
          source: "FORGE",
          url: "/api/assets/asset-2",
        });

      const request = new NextRequest("https://example.com/api/assets/unified?action=link", {
        method: "POST",
        body: JSON.stringify({
          sourceId: "asset-1",
          targetId: "asset-2",
          relationshipType: "drops",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.relationship).toBeDefined();
    });

    it("throws error for invalid action", async () => {
      const request = new NextRequest("https://example.com/api/assets/unified?action=invalid", {
        method: "POST",
        body: JSON.stringify({}),
      });

      await expect(POST(request)).rejects.toThrow("POST only supports ?action=link");
    });

    it("returns 404 when assets not found", async () => {
      const { getAssetById } = await import("@/lib/assets");
      vi.mocked(getAssetById).mockResolvedValue(null);

      const request = new NextRequest("https://example.com/api/assets/unified?action=link", {
        method: "POST",
        body: JSON.stringify({
          sourceId: "non-existent",
          targetId: "non-existent-2",
          relationshipType: "drops",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe("DELETE /api/assets/unified", () => {
    it("unlinks assets with action=unlink", async () => {
      const { removeRelationship } = await import("@/lib/relationships/relationship-service");
      vi.mocked(removeRelationship).mockResolvedValue(true);

      const request = new NextRequest("https://example.com/api/assets/unified?action=unlink", {
        method: "DELETE",
        body: JSON.stringify({
          sourceId: "asset-1",
          targetId: "asset-2",
          relationshipType: "drops",
        }),
      });

      const response = await DELETE(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.removed).toBeDefined();
    });

    it("throws error for invalid action", async () => {
      const request = new NextRequest("https://example.com/api/assets/unified?action=invalid", {
        method: "DELETE",
        body: JSON.stringify({}),
      });

      await expect(DELETE(request)).rejects.toThrow("DELETE only supports ?action=unlink");
    });

    it("returns 404 when relationship not found", async () => {
      const { removeRelationship } = await import("@/lib/relationships/relationship-service");
      vi.mocked(removeRelationship).mockResolvedValue(false);

      const request = new NextRequest("https://example.com/api/assets/unified?action=unlink", {
        method: "DELETE",
        body: JSON.stringify({
          sourceId: "asset-1",
          targetId: "asset-2",
          relationshipType: "drops",
        }),
      });

      const response = await DELETE(request);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });
});
