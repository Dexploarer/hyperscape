/**
 * Assets Mesh Stats API Route Tests
 *
 * Tests for /api/assets/mesh-stats route handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock fetch
globalThis.fetch = vi.fn() as unknown as typeof fetch;

describe("API Route: /api/assets/mesh-stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/assets/mesh-stats", () => {
    it("requires url parameter", async () => {
      const request = new NextRequest("https://example.com/api/assets/mesh-stats");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("URL parameter required");
    });

    it("analyzes GLB file and returns stats", async () => {
      // Create a minimal valid GLB file structure
      const glbHeader = new ArrayBuffer(20);
      const view = new DataView(glbHeader);
      view.setUint32(0, 0x46546c67, true); // "glTF" magic
      view.setUint32(4, 2, true); // Version
      view.setUint32(8, 100, true); // Total length
      view.setUint32(12, 50, true); // JSON chunk length
      view.setUint32(16, 0x4e4f534a, true); // "JSON" chunk type

      const jsonData = JSON.stringify({
        meshes: [
          {
            primitives: [
              {
                attributes: { POSITION: 0 },
                indices: 1,
              },
            ],
          },
        ],
        accessors: [
          { count: 100, type: "VEC3" }, // POSITION
          { count: 300, type: "SCALAR" }, // Indices
        ],
        materials: [{ pbrMetallicRoughness: {} }],
      });

      const jsonBytes = new TextEncoder().encode(jsonData);
      const fullGlb = new Uint8Array(20 + jsonBytes.length);
      fullGlb.set(new Uint8Array(glbHeader), 0);
      fullGlb.set(jsonBytes, 20);

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "model/gltf-binary" }),
        arrayBuffer: async () => fullGlb.buffer,
      } as Response);

      const request = new NextRequest(
        "https://example.com/api/assets/mesh-stats?url=https://example.com/model.glb",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.vertices).toBeDefined();
      expect(body.triangles).toBeDefined();
      expect(body.polycount).toBeDefined();
      expect(body.meshCount).toBeDefined();
    });

    it("handles fetch errors", async () => {
      vi.mocked(globalThis.fetch).mockRejectedValue(new Error("Network error"));

      const request = new NextRequest(
        "https://example.com/api/assets/mesh-stats?url=https://example.com/model.glb",
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it("handles invalid GLB files", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "model/gltf-binary" }),
        arrayBuffer: async () => new ArrayBuffer(10), // Too small
      } as Response);

      const request = new NextRequest(
        "https://example.com/api/assets/mesh-stats?url=https://example.com/invalid.glb",
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });
});
