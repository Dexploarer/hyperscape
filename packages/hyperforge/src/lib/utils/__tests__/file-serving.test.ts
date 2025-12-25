/**
 * File Serving Tests
 *
 * Tests for file serving utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  createFileResponse,
  createModelResponse,
  IMMUTABLE_CACHE_HEADERS,
} from "../file-serving";
import { NextResponse } from "next/server";

describe("FileServing", () => {
  it("creates file response with proper headers", () => {
    const buffer = Buffer.from("test content");
    const response = createFileResponse(buffer, "test.txt", {
      contentType: "text/plain",
    });

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.headers.get("Content-Length")).toBe("12");
  });

  it("creates file response with cache control", () => {
    const buffer = Buffer.from("test");
    const response = createFileResponse(buffer, "test.txt", {
      cacheControl: "no-cache",
    });

    expect(response.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("creates file response with attachment disposition", () => {
    const buffer = Buffer.from("test");
    const response = createFileResponse(buffer, "test.txt", {
      disposition: "attachment",
    });

    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(response.headers.get("Content-Disposition")).toContain("test.txt");
  });

  it("creates model response", () => {
    const buffer = Buffer.from("fake model data");
    const response = createModelResponse(buffer, "test-model", "glb");

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get("Content-Type")).toContain("gltf");
  });

  it("exports immutable cache headers", () => {
    expect(IMMUTABLE_CACHE_HEADERS).toBeDefined();
    expect(IMMUTABLE_CACHE_HEADERS["Cache-Control"]).toContain("immutable");
  });
});
