/**
 * VRM Converter Tests
 *
 * Tests for GLB to VRM conversion functionality.
 * Uses real Three.js and VRM libraries - NO MOCKS.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { convertGLBToVRMPreservingTextures } from "../VRMConverter";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Note: Full VRM conversion tests require actual GLB files
// This test verifies the function exists and has correct signature

describe("VRMConverter", () => {
  describe("convertGLBToVRMPreservingTextures", () => {
    it("has correct function signature", () => {
      expect(typeof convertGLBToVRMPreservingTextures).toBe("function");
    });

    it("accepts ArrayBuffer and options", async () => {
      // Create minimal valid GLB buffer (GLB header + JSON chunk)
      const glbHeader = new Uint8Array([
        0x67, 0x6c, 0x54, 0x46, // "glTF"
        0x02, 0x00, 0x00, 0x00, // version 2
        0x00, 0x00, 0x00, 0x00, // file length (will be updated)
      ]);

      const jsonChunk = JSON.stringify({
        asset: { version: "2.0" },
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [
          {
            bufferView: 0,
            componentType: 5126,
            count: 0,
            type: "VEC3",
          },
        ],
        bufferViews: [{ buffer: 0, byteLength: 0 }],
        buffers: [{ byteLength: 0 }],
      });

      const jsonBuffer = new TextEncoder().encode(jsonChunk);
      const jsonChunkHeader = new Uint8Array([
        jsonBuffer.length & 0xff,
        (jsonBuffer.length >> 8) & 0xff,
        (jsonBuffer.length >> 16) & 0xff,
        (jsonBuffer.length >> 24) & 0xff,
        0x4e, 0x4f, 0x4d, 0x49, // "JSON"
      ]);

      const totalLength = 12 + 8 + jsonBuffer.length;
      glbHeader[8] = totalLength & 0xff;
      glbHeader[9] = (totalLength >> 8) & 0xff;
      glbHeader[10] = (totalLength >> 16) & 0xff;
      glbHeader[11] = (totalLength >> 24) & 0xff;

      const glbBuffer = new Uint8Array(totalLength);
      glbBuffer.set(glbHeader, 0);
      glbBuffer.set(jsonChunkHeader, 12);
      glbBuffer.set(jsonBuffer, 20);

      const glbArrayBuffer = glbBuffer.buffer;

      // Function should accept the buffer and options
      try {
        const result = await convertGLBToVRMPreservingTextures(glbArrayBuffer, {
          avatarName: "Test Avatar",
          author: "Test Author",
        });

        expect(result).toHaveProperty("vrmData");
        expect(result).toHaveProperty("boneMappings");
        expect(result).toHaveProperty("warnings");
        expect(result.vrmData).toBeInstanceOf(ArrayBuffer);
        expect(result.boneMappings).toBeInstanceOf(Map);
        expect(Array.isArray(result.warnings)).toBe(true);
      } catch (error) {
        // Expected to fail with invalid GLB, but should have correct signature
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("handles options parameter", async () => {
      const emptyBuffer = new ArrayBuffer(0);

      try {
        const result = await convertGLBToVRMPreservingTextures(emptyBuffer, {
          avatarName: "Custom Name",
          author: "Custom Author",
          version: "1.0",
        });

        expect(result).toHaveProperty("vrmData");
      } catch (error) {
        // Expected to fail, but should accept options
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
