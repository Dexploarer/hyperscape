/**
 * Assets Upload API Route Tests
 *
 * Tests for /api/assets/upload route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock the routing layer
vi.mock("@/lib/api/routing", () => ({
  assetsRoutes: {
    POST: {
      upload: vi.fn(),
    },
  },
}));

describe("API Route: /api/assets/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/assets/upload", () => {
    it("delegates to assetsRoutes.POST.upload", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockResponse = new Response(
        JSON.stringify({
          success: true,
          asset: {
            id: "uploaded-asset",
            name: "Uploaded Asset",
            modelUrl: "/api/assets/uploaded-asset/model.glb",
          },
        }),
        { status: 200 },
      );
      vi.mocked(assetsRoutes.POST.upload).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append("file", new Blob(["model-data"]), "model.glb");
      formData.append("name", "Uploaded Asset");

      const request = new NextRequest("https://example.com/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request, { params: Promise.resolve({}) });

      expect(assetsRoutes.POST.upload).toHaveBeenCalled();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.asset).toBeDefined();
    });

    it("has correct route configuration", () => {
      expect(require("./route")).toHaveProperty("config");
    });
  });
});
