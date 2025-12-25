/**
 * Content Types Tests
 *
 * Tests for content type utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  getContentTypeFromExtension,
  getModelContentType,
  getExtensionFromContentType,
  isValidImageMimeType,
  VALID_IMAGE_MIME_TYPES,
  DEFAULT_CONTENT_TYPES,
} from "../content-types";

describe("ContentTypes", () => {
  it("gets content type from extension", () => {
    expect(getContentTypeFromExtension("test.png")).toBe("image/png");
    expect(getContentTypeFromExtension("test.jpg")).toBe("image/jpeg");
    expect(getContentTypeFromExtension("test.glb")).toBe("model/gltf-binary");
    expect(getContentTypeFromExtension("test.vrm")).toBe("model/vrm");
    expect(getContentTypeFromExtension("test.mp3")).toBe("audio/mpeg");
    expect(getContentTypeFromExtension("test.json")).toBe("application/json");
  });

  it("returns default for unknown extension", () => {
    const contentType = getContentTypeFromExtension("test.unknown");
    expect(contentType).toBe("application/octet-stream");
  });

  it("gets model content type", () => {
    expect(getModelContentType("glb")).toBe("model/gltf-binary");
    expect(getModelContentType("gltf")).toBe("model/gltf+json");
    expect(getModelContentType("vrm")).toBe("application/octet-stream");
  });

  it("gets extension from content type", () => {
    expect(getExtensionFromContentType("image/png")).toBe("png");
    expect(getExtensionFromContentType("image/jpeg")).toBe("jpg");
    expect(getExtensionFromContentType("model/gltf-binary")).toBe("glb");
    expect(getExtensionFromContentType("audio/mpeg")).toBe("mp3");
  });

  it("validates image MIME types", () => {
    expect(isValidImageMimeType("image/png")).toBe(true);
    expect(isValidImageMimeType("image/jpeg")).toBe(true);
    expect(isValidImageMimeType("image/webp")).toBe(true);
    expect(isValidImageMimeType("text/plain")).toBe(false);
  });

  it("exports valid image MIME types", () => {
    expect(Array.isArray(VALID_IMAGE_MIME_TYPES)).toBe(true);
    expect(VALID_IMAGE_MIME_TYPES.length).toBeGreaterThan(0);
  });

  it("exports default content types", () => {
    expect(DEFAULT_CONTENT_TYPES).toBeDefined();
    expect(DEFAULT_CONTENT_TYPES.image).toBeDefined();
    expect(DEFAULT_CONTENT_TYPES.audio).toBeDefined();
  });
});
