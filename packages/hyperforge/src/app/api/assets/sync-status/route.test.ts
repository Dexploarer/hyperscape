/**
 * Assets Sync Status API Route Tests
 *
 * Tests for /api/assets/sync-status route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock dependencies
vi.mock("fs", () => ({
  promises: {
    readdir: vi.fn(),
    readFile: vi.fn(),
    access: vi.fn(),
  },
}));

describe("API Route: /api/assets/sync-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/sync-status", () => {
    it("requires assetId parameter", async () => {
      const request = new NextRequest("https://example.com/api/assets/sync-status");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("assetId required");
    });

    it("returns sync status for asset in game", async () => {
      const { promises: fs } = await import("fs");
      vi.mocked(fs.readdir).mockResolvedValue(["model.glb"] as never);
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify([{ id: "asset-123" }]) as never,
      );

      const request = new NextRequest(
        "https://example.com/api/assets/sync-status?assetId=asset-123",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.assetId).toBe("asset-123");
      expect(body.status).toBe("in_game");
      expect(body.details).toBeDefined();
    });

    it("returns exported status when model exists but not in manifest", async () => {
      const { promises: fs } = await import("fs");
      vi.mocked(fs.readdir).mockResolvedValue(["model.glb"] as never);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([]) as never);

      const request = new NextRequest(
        "https://example.com/api/assets/sync-status?assetId=asset-123",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("exported");
    });

    it("returns draft status when asset not found", async () => {
      const { promises: fs } = await import("fs");
      vi.mocked(fs.readdir).mockRejectedValue(new Error("Not found"));
      vi.mocked(fs.readFile).mockRejectedValue(new Error("Not found"));

      const request = new NextRequest(
        "https://example.com/api/assets/sync-status?assetId=non-existent",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("draft");
    });

    it("handles errors gracefully", async () => {
      const { promises: fs } = await import("fs");
      vi.mocked(fs.readdir).mockRejectedValue(new Error("FS error"));

      const request = new NextRequest(
        "https://example.com/api/assets/sync-status?assetId=asset-123",
      );
      const response = await GET(request);

      expect([200, 500]).toContain(response.status);
    });
  });
});
