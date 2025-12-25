/**
 * Assets Validate API Route Tests
 *
 * Tests for /api/assets/validate route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// Mock dependencies
vi.mock("@/lib/assets/asset-completeness", () => ({
  calculateCompleteness: vi.fn().mockReturnValue({
    completeness: 85,
    exportReady: true,
    blockingIssues: [],
  }),
  getSchema: vi.fn().mockReturnValue({
    type: "weapon",
    name: "Weapon",
    fields: {},
  }),
  getAllSchemas: vi.fn().mockReturnValue([
    {
      type: "weapon",
      name: "Weapon",
      description: "Weapon schema",
      fields: {},
      fileFields: [],
      associations: [],
    },
  ]),
}));

describe("API Route: /api/assets/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/validate", () => {
    it("returns available schemas", async () => {
      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.schemas).toBeDefined();
      expect(Array.isArray(body.schemas)).toBe(true);
    });
  });

  describe("POST /api/assets/validate", () => {
    it("validates a single asset", async () => {
      const request = new NextRequest("https://example.com/api/assets/validate", {
        method: "POST",
        body: JSON.stringify({
          asset: {
            id: "asset-1",
            type: "weapon",
            data: { name: "Iron Sword", category: "weapon" },
          },
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.total).toBe(1);
      expect(body.summaries).toHaveLength(1);
      expect(body.summaries[0].assetId).toBe("asset-1");
    });

    it("validates multiple assets", async () => {
      const request = new NextRequest("https://example.com/api/assets/validate", {
        method: "POST",
        body: JSON.stringify({
          assets: [
            {
              id: "asset-1",
              type: "weapon",
              data: { name: "Iron Sword" },
            },
            {
              id: "asset-2",
              type: "armor",
              data: { name: "Iron Armor" },
            },
          ],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.total).toBe(2);
      expect(body.summaries).toHaveLength(2);
    });

    it("includes full reports when requested", async () => {
      const request = new NextRequest("https://example.com/api/assets/validate", {
        method: "POST",
        body: JSON.stringify({
          asset: {
            id: "asset-1",
            type: "weapon",
            data: { name: "Iron Sword" },
          },
          fullReports: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.reports).toBeDefined();
      expect(body.reports).toHaveLength(1);
    });

    it("validates request body", async () => {
      const request = new NextRequest("https://example.com/api/assets/validate", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it("handles unknown asset types", async () => {
      const { getSchema } = await import("@/lib/assets/asset-completeness");
      vi.mocked(getSchema).mockReturnValue(null);

      const request = new NextRequest("https://example.com/api/assets/validate", {
        method: "POST",
        body: JSON.stringify({
          asset: {
            id: "asset-1",
            type: "unknown-type",
            data: {},
          },
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.summaries[0].exportReady).toBe(false);
      expect(body.summaries[0].blockingIssues).toContain("Unknown asset type");
    });
  });
});
