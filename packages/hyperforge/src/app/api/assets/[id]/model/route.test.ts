/**
 * Assets [id] Model API Route Tests
 *
 * Tests for /api/assets/[id]/model route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, HEAD } from "./route";

// Mock the routing layer
vi.mock("@/lib/api/routing", () => ({
  assetsRoutes: {
    GET: {
      model: vi.fn(),
    },
  },
}));

describe("API Route: /api/assets/[id]/model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/[id]/model", () => {
    it("delegates to assetsRoutes.GET.model with correct id and format", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockHandler = vi.fn().mockResolvedValue(
        new Response(new Blob(["model-data"]), {
          status: 200,
          headers: { "Content-Type": "model/gltf-binary" },
        }),
      );
      vi.mocked(assetsRoutes.GET.model).mockReturnValue(mockHandler);

      const request = new NextRequest(
        "https://example.com/api/assets/asset-123/model?format=glb",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123" }),
      });

      expect(assetsRoutes.GET.model).toHaveBeenCalledWith("asset-123", "glb");
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("uses default format when not specified", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockHandler = vi.fn().mockResolvedValue(
        new Response(new Blob(["model-data"]), { status: 200 }),
      );
      vi.mocked(assetsRoutes.GET.model).mockReturnValue(mockHandler);

      const request = new NextRequest("https://example.com/api/assets/asset-123/model");
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123" }),
      });

      expect(assetsRoutes.GET.model).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("throws error when id is missing", async () => {
      const request = new NextRequest("https://example.com/api/assets//model");

      await expect(
        GET(request, { params: Promise.resolve({ id: "" }) }),
      ).rejects.toThrow("Asset ID is required");
    });

    it("validates format query parameter", async () => {
      const request = new NextRequest(
        "https://example.com/api/assets/asset-123/model?format=invalid",
      );

      await expect(
        GET(request, { params: Promise.resolve({ id: "asset-123" }) }),
      ).rejects.toThrow();
    });
  });

  describe("HEAD /api/assets/[id]/model", () => {
    it("checks if model exists", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockHandler = vi.fn().mockResolvedValue(
        new Response(new Blob(["model-data"]), { status: 200 }),
      );
      vi.mocked(assetsRoutes.GET.model).mockReturnValue(mockHandler);

      const request = new NextRequest("https://example.com/api/assets/asset-123/model");
      const response = await HEAD(request, {
        params: Promise.resolve({ id: "asset-123" }),
      });

      expect(assetsRoutes.GET.model).toHaveBeenCalledWith("asset-123", "glb");
      expect(response.status).toBe(200);
    });

    it("returns 404 when model not found", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockHandler = vi.fn().mockRejectedValue(new Error("Not found"));
      vi.mocked(assetsRoutes.GET.model).mockReturnValue(mockHandler);

      const request = new NextRequest("https://example.com/api/assets/non-existent/model");
      const response = await HEAD(request, {
        params: Promise.resolve({ id: "non-existent" }),
      });

      expect(response.status).toBe(404);
    });

    it("returns 400 when id is missing", async () => {
      const request = new NextRequest("https://example.com/api/assets//model");

      const response = await HEAD(request, {
        params: Promise.resolve({ id: "" }),
      });

      expect(response.status).toBe(400);
    });
  });
});
