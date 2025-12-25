/**
 * Structures Schemas Tests
 *
 * Tests for structure API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  BuildingPieceTypeSchema,
  StructureStyleSchema,
  BuildingPieceSchema,
  PieceGenerateRequestSchema,
  PlacedPieceSchema,
} from "../structures";

describe("StructuresSchemas", () => {
  it("validates building piece type", () => {
    const result = BuildingPieceTypeSchema.safeParse("wall");
    expect(result.success).toBe(true);
  });

  it("validates structure style", () => {
    const result = StructureStyleSchema.safeParse("medieval");
    expect(result.success).toBe(true);
  });

  it("validates building piece", () => {
    const result = BuildingPieceSchema.safeParse({
      id: "test-piece",
      name: "Test Piece",
      type: "wall",
      modelUrl: "https://example.com/piece.glb",
      dimensions: { width: 1, height: 2, depth: 0.5 },
    });
    expect(result.success).toBe(true);
  });

  it("validates piece generation request", () => {
    const result = PieceGenerateRequestSchema.safeParse({
      type: "wall",
      style: "medieval",
      prompt: "A stone wall",
    });
    expect(result.success).toBe(true);
  });

  it("validates placed piece", () => {
    const result = PlacedPieceSchema.safeParse({
      id: "placed-1",
      pieceId: "test-piece",
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
    });
    expect(result.success).toBe(true);
  });
});
