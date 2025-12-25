/**
 * Asset Schemas Tests
 *
 * Tests for asset Zod schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  Position3DSchema,
  Rotation3DSchema,
  Scale3DSchema,
  Transform3DSchema,
  BaseAssetSchema,
  CDNAssetFullSchema,
} from "../asset-schemas";

describe("AssetSchemas", () => {
  it("validates position 3D", () => {
    const result = Position3DSchema.safeParse({ x: 1, y: 2, z: 3 });
    expect(result.success).toBe(true);
  });

  it("validates rotation 3D", () => {
    const result = Rotation3DSchema.safeParse({ x: 0, y: 0, z: 0 });
    expect(result.success).toBe(true);
  });

  it("validates uniform scale", () => {
    const result = Scale3DSchema.safeParse(1.5);
    expect(result.success).toBe(true);
  });

  it("validates per-axis scale", () => {
    const result = Scale3DSchema.safeParse({ x: 1, y: 2, z: 1 });
    expect(result.success).toBe(true);
  });

  it("validates transform 3D", () => {
    const result = Transform3DSchema.safeParse({
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
    });
    expect(result.success).toBe(true);
  });

  it("validates base asset", () => {
    const result = BaseAssetSchema.safeParse({
      id: "test-item",
      name: "Test Item",
      source: "CDN",
      category: "weapon",
    });
    expect(result.success).toBe(true);
  });

  it("validates CDN asset full", () => {
    const result = CDNAssetFullSchema.safeParse({
      id: "test-item",
      name: "Test Item",
      source: "CDN",
      category: "weapon",
      modelPath: "/models/test.glb",
      value: 100,
    });
    expect(result.success).toBe(true);
  });
});
