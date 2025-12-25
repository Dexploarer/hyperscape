/**
 * Assets API Route Tests
 *
 * Tests for /api/assets route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock the routing layer
vi.mock("@/lib/api/routing", () => ({
  assetsRoutes: {
    GET: {
      list: vi.fn(),
    },
  },
}));

describe("API Route: /api/assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets", () => {
    it("delegates to assetsRoutes.GET.list", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          assets: [
            { id: "asset-1", name: "Test Asset", source: "FORGE" },
            { id: "asset-2", name: "CDN Asset", source: "CDN" },
          ],
          total: 2,
        }),
        { status: 200 },
      );
      vi.mocked(assetsRoutes.GET.list).mockResolvedValue(mockResponse);

      const request = new NextRequest("https://example.com/api/assets");
      const response = await GET(request, { params: Promise.resolve({}) });

      expect(assetsRoutes.GET.list).toHaveBeenCalledWith(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.assets).toHaveLength(2);
    });

    it("handles query parameters", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          assets: [],
          total: 0,
        }),
        { status: 200 },
      );
      vi.mocked(assetsRoutes.GET.list).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "https://example.com/api/assets?category=weapon&source=FORGE&limit=10",
      );
      const response = await GET(request, { params: Promise.resolve({}) });

      expect(assetsRoutes.GET.list).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });
});
