/**
 * VRM Schemas Tests
 *
 * Tests for VRM conversion schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import { VRMConvertSchema } from "../vrm";

describe("VRMSchemas", () => {
  it("validates VRM convert with modelUrl", () => {
    const result = VRMConvertSchema.safeParse({
      modelUrl: "https://example.com/model.glb",
    });
    expect(result.success).toBe(true);
  });

  it("validates VRM convert with glbData", () => {
    const result = VRMConvertSchema.safeParse({
      glbData: "base64encodeddata",
    });
    expect(result.success).toBe(true);
  });

  it("rejects VRM convert without modelUrl or glbData", () => {
    const result = VRMConvertSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("validates VRM convert with optional fields", () => {
    const result = VRMConvertSchema.safeParse({
      modelUrl: "https://example.com/model.glb",
      avatarName: "Test Avatar",
      author: "Test Author",
    });
    expect(result.success).toBe(true);
  });
});
