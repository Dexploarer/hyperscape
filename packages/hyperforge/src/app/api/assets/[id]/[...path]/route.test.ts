/**
 * Assets [id] [...path] API Route Tests
 *
 * Tests for /api/assets/[id]/[...path] route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, HEAD } from "./route";

// Mock dependencies
vi.mock("@/lib/cdn/loader", () => ({
  loadCDNAssets: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/storage/supabase-storage", () => ({
  getForgeAsset: vi.fn().mockResolvedValue(null),
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
  getSupabasePublicUrl: vi.fn().mockReturnValue("https://supabase.example.com/file.glb"),
  BUCKET_NAMES: {
    MESHY_MODELS: "meshy-models",
    VRM_CONVERSION: "vrm-conversion",
    CONCEPT_ART: "concept-art-pipeline",
  },
}));

vi.mock("@/lib/storage/asset-storage", () => ({
  assetExists: vi.fn().mockResolvedValue(false),
  getAssetDir: vi.fn().mockReturnValue("/assets/test-id"),
}));

vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

describe("API Route: /api/assets/[id]/[...path]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/[id]/[...path]", () => {
    it("requires path parameter", async () => {
      const request = new NextRequest("https://example.com/api/assets/asset-123");
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123", path: [] }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Path required");
    });

    it("serves CDN asset model", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      vi.mocked(loadCDNAssets).mockResolvedValue([
        {
          id: "asset-123",
          name: "CDN Asset",
          category: "weapon",
          modelPath: "items/sword.glb",
          type: "sword",
        },
      ]);

      const request = new NextRequest("https://example.com/api/assets/asset-123/model.glb");
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123", path: ["model.glb"] }),
      });

      expect(response.status).toBe(307); // Redirect
    });

    it("serves Supabase asset model", async () => {
      const { getForgeAsset } = await import("@/lib/storage/supabase-storage");
      vi.mocked(getForgeAsset).mockResolvedValue({
        id: "asset-123",
        name: "Forge Asset",
        modelUrl: "https://supabase.example.com/model.glb",
        thumbnailUrl: "https://supabase.example.com/thumbnail.png",
      });

      const request = new NextRequest("https://example.com/api/assets/asset-123/model.glb");
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123", path: ["model.glb"] }),
      });

      expect(response.status).toBe(307); // Redirect
    });

    it("serves local filesystem file", async () => {
      const { assetExists } = await import("@/lib/storage/asset-storage");
      const { promises: fs } = await import("fs");
      vi.mocked(assetExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from("file-content"));

      const request = new NextRequest("https://example.com/api/assets/asset-123/model.glb");
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123", path: ["model.glb"] }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("model/gltf-binary");
    });

    it("prevents directory traversal", async () => {
      const { assetExists } = await import("@/lib/storage/asset-storage");
      vi.mocked(assetExists).mockResolvedValue(true);

      const request = new NextRequest("https://example.com/api/assets/asset-123/../../etc/passwd");
      const response = await GET(request, {
        params: Promise.resolve({ id: "asset-123", path: ["..", "..", "etc", "passwd"] }),
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Invalid path");
    });

    it("returns 404 when file not found", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      const { getForgeAsset } = await import("@/lib/storage/supabase-storage");
      const { assetExists } = await import("@/lib/storage/asset-storage");
      vi.mocked(loadCDNAssets).mockResolvedValue([]);
      vi.mocked(getForgeAsset).mockResolvedValue(null);
      vi.mocked(assetExists).mockResolvedValue(false);

      const request = new NextRequest("https://example.com/api/assets/non-existent/model.glb");
      const response = await GET(request, {
        params: Promise.resolve({ id: "non-existent", path: ["model.glb"] }),
      });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("File not found");
    });
  });

  describe("HEAD /api/assets/[id]/[...path]", () => {
    it("checks if file exists in CDN", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      vi.mocked(loadCDNAssets).mockResolvedValue([
        {
          id: "asset-123",
          name: "CDN Asset",
          modelPath: "items/sword.glb",
          category: "weapon",
        },
      ]);

      const request = new NextRequest("https://example.com/api/assets/asset-123/model.glb");
      const response = await HEAD(request, {
        params: Promise.resolve({ id: "asset-123", path: ["model.glb"] }),
      });

      expect(response.status).toBe(200);
    });

    it("returns 404 when file not found", async () => {
      const { loadCDNAssets } = await import("@/lib/cdn/loader");
      const { getForgeAsset } = await import("@/lib/storage/supabase-storage");
      const { assetExists } = await import("@/lib/storage/asset-storage");
      vi.mocked(loadCDNAssets).mockResolvedValue([]);
      vi.mocked(getForgeAsset).mockResolvedValue(null);
      vi.mocked(assetExists).mockResolvedValue(false);

      const request = new NextRequest("https://example.com/api/assets/non-existent/model.glb");
      const response = await HEAD(request, {
        params: Promise.resolve({ id: "non-existent", path: ["model.glb"] }),
      });

      expect(response.status).toBe(404);
    });
  });
});
