/**
 * Assets History API Route Tests
 *
 * Tests for /api/assets/history route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock dependencies
vi.mock("@/lib/db/asset-queries", () => ({
  getGenerationHistory: vi.fn().mockResolvedValue([]),
  getGenerationHistoryCount: vi.fn().mockResolvedValue(0),
}));

describe("API Route: /api/assets/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/history", () => {
    it("returns generation history with pagination", async () => {
      const { getGenerationHistory, getGenerationHistoryCount } = await import(
        "@/lib/db/asset-queries"
      );
      vi.mocked(getGenerationHistory).mockResolvedValue([
        {
          id: "asset-1",
          name: "Generated Asset",
          type: "item",
          category: "weapon",
          prompt: "A sword",
          aiModel: "meshy-4",
          status: "completed",
          thumbnailPath: "/assets/asset-1/thumbnail.png",
          localPath: "/assets/asset-1/model.glb",
          createdAt: new Date(),
          generationParams: {},
        },
      ]);
      vi.mocked(getGenerationHistoryCount).mockResolvedValue(1);

      const request = new NextRequest("https://example.com/api/assets/history?limit=10&offset=0");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.history).toBeDefined();
      expect(Array.isArray(body.history)).toBe(true);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.total).toBe(1);
    });

    it("transforms assets with URLs", async () => {
      const { getGenerationHistory, getGenerationHistoryCount } = await import(
        "@/lib/db/asset-queries"
      );
      vi.mocked(getGenerationHistory).mockResolvedValue([
        {
          id: "asset-1",
          name: "Generated Asset",
          type: "item",
          category: "weapon",
          prompt: "A sword",
          aiModel: "meshy-4",
          status: "completed",
          thumbnailPath: "/assets/asset-1/thumbnail.png",
          localPath: "/assets/asset-1/model.glb",
          createdAt: new Date(),
          generationParams: {},
        },
      ]);
      vi.mocked(getGenerationHistoryCount).mockResolvedValue(1);

      const request = new NextRequest("https://example.com/api/assets/history");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.history[0].thumbnailUrl).toBe("/api/assets/asset-1/thumbnail.png");
      expect(body.history[0].modelUrl).toBe("/api/assets/asset-1/model.glb");
    });

    it("validates query parameters", async () => {
      const request = new NextRequest(
        "https://example.com/api/assets/history?limit=invalid&offset=invalid",
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("handles database errors", async () => {
      const { getGenerationHistory } = await import("@/lib/db/asset-queries");
      vi.mocked(getGenerationHistory).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("https://example.com/api/assets/history");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });
});
