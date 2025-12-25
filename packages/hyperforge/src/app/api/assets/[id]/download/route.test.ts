/**
 * Assets [id] Download API Route Tests
 *
 * Tests for /api/assets/[id]/download route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock the routing layer
vi.mock("@/lib/api/routing", () => ({
  assetsRoutes: {
    GET: {
      download: vi.fn(),
    },
  },
}));

describe("API Route: /api/assets/[id]/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/[id]/download", () => {
    it("delegates to assetsRoutes.GET.download with correct id and format", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockHandler = vi.fn().mockResolvedValue(
        new Response(new Blob(["model-data"]), {
          status: 200,
          headers: { "Content-Type": "model/gltf-binary" },
        }),
      );
      vi.mocked(assetsRoutes.GET.download).mockReturnValue(mockHandler);

      const request = new NextRequest(
        "https://example.com/api/assets/asset-123/download?format=glb",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123" }),
      });

      expect(assetsRoutes.GET.download).toHaveBeenCalledWith("asset-123", "glb");
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("uses default format when not specified", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockHandler = vi.fn().mockResolvedValue(
        new Response(new Blob(["model-data"]), { status: 200 }),
      );
      vi.mocked(assetsRoutes.GET.download).mockReturnValue(mockHandler);

      const request = new NextRequest("https://example.com/api/assets/asset-123/download");
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123" }),
      });

      expect(assetsRoutes.GET.download).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("throws error when id is missing", async () => {
      const request = new NextRequest("https://example.com/api/assets//download");

      await expect(
        GET(request, { params: Promise.resolve({ id: "" }) }),
      ).rejects.toThrow("Asset ID is required");
    });

    it("validates format query parameter", async () => {
      const request = new NextRequest(
        "https://example.com/api/assets/asset-123/download?format=invalid",
      );

      await expect(
        GET(request, { params: Promise.resolve({ id: "asset-123" }) }),
      ).rejects.toThrow();
    });
  });
});
