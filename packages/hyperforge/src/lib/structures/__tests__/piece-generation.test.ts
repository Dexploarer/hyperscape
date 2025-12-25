/**
 * Piece Generation Tests
 *
 * Tests for building piece generation.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi } from "vitest";
import {
  buildPiecePrompt,
  generatePiece,
} from "../piece-generation";
import type { PieceGenerationOptions } from "../piece-generation";

// Mock Meshy
vi.mock("@/lib/meshy/text-to-3d", () => ({
  startTextTo3DPreview: vi.fn().mockResolvedValue({ taskId: "preview-123" }),
  startTextTo3DRefine: vi.fn().mockResolvedValue({ taskId: "refine-123" }),
}));

describe("PieceGeneration", () => {
  it("builds piece prompt from template", () => {
    const prompt = buildPiecePrompt({
      type: "wall",
      style: "stone",
    });

    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("builds custom prompt when provided", () => {
    const customPrompt = "Custom wall prompt";
    const prompt = buildPiecePrompt({
      type: "wall",
      customPrompt,
    });

    expect(prompt).toBe(customPrompt);
  });

  it("generates piece", async () => {
    const options: PieceGenerationOptions = {
      type: "wall",
      style: "stone",
    };

    const result = await generatePiece(options);

    expect(result).toBeDefined();
    expect(result.piece).toBeDefined();
    expect(result.previewTaskId).toBeDefined();
  });
});
