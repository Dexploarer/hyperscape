/**
 * Assets [id] Duplicate API Route Tests
 *
 * Tests for /api/assets/[id]/duplicate route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock the routing layer
vi.mock("@/lib/api/routing", () => ({
  assetsRoutes: {
    POST: {
      duplicate: vi.fn(),
    },
  },
}));

describe("API Route: /api/assets/[id]/duplicate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/assets/[id]/duplicate", () => {
    it("delegates to assetsRoutes.POST.duplicate with correct id", async () => {
      const { assetsRoutes } = await import("@/lib/api/routing");
      const mockHandler = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            asset: { id: "duplicated-asset", name: "Duplicated Asset" },
          }),
          { status: 200 },
        ),
      );
      vi.mocked(assetsRoutes.POST.duplicate).mockReturnValue(mockHandler);

      const request = new NextRequest("https://example.com/api/assets/asset-123/duplicate", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: "asset-123" }),
      });

      expect(assetsRoutes.POST.duplicate).toHaveBeenCalledWith("asset-123");
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it("throws error when id is missing", async () => {
      const request = new NextRequest("https://example.com/api/assets//duplicate", {
        method: "POST",
      });

      await expect(
        POST(request, { params: Promise.resolve({ id: "" }) }),
      ).rejects.toThrow("Source asset ID is required");
    });
  });
});
