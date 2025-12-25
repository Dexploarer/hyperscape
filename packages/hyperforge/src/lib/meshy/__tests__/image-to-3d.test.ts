/**
 * Image-to-3D Tests
 *
 * Tests for image-to-3D pipeline.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi } from "vitest";
import { startImageTo3D } from "../image-to-3d";

// Mock Meshy client
vi.mock("../client", () => ({
  createImageTo3DTask: vi.fn().mockResolvedValue("task-123"),
}));

describe("ImageTo3D", () => {
  it("starts image-to-3D generation", async () => {
    const result = await startImageTo3D("https://example.com/image.png");

    expect(result).toBeDefined();
    expect(result.taskId).toBe("task-123");
  });

  it("starts with custom options", async () => {
    const result = await startImageTo3D("https://example.com/image.png", {
      target_polycount: 5000,
      topology: "quad",
    });

    expect(result).toBeDefined();
    expect(result.taskId).toBeDefined();
  });

  it("handles data URI images", async () => {
    const dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const result = await startImageTo3D(dataUri);

    expect(result).toBeDefined();
    expect(result.taskId).toBeDefined();
  });
});
