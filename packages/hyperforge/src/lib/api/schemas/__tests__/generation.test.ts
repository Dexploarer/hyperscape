/**
 * Generation Schemas Tests
 *
 * Tests for generation route schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  GenerationPipelineSchema,
  AIProviderSchema,
  GenerationOptionsSchema,
  GenerationConfigSchema,
  GenerationRequestSchema,
} from "../generation";

describe("GenerationSchemas", () => {
  it("validates generation pipeline", () => {
    const result = GenerationPipelineSchema.safeParse("text-to-3d");
    expect(result.success).toBe(true);
  });

  it("validates AI provider", () => {
    const result = AIProviderSchema.safeParse("openai");
    expect(result.success).toBe(true);
  });

  it("validates generation options", () => {
    const result = GenerationOptionsSchema.safeParse({
      enablePBR: true,
      topology: "quad",
      targetPolycount: 2000,
    });
    expect(result.success).toBe(true);
  });

  it("validates generation config", () => {
    const result = GenerationConfigSchema.safeParse({
      prompt: "A bronze sword",
      category: "weapon",
    });
    expect(result.success).toBe(true);
  });

  it("validates generate action", () => {
    const result = GenerationRequestSchema.safeParse({
      action: "generate",
      config: {
        prompt: "A bronze sword",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates generate concept art action", () => {
    const result = GenerationRequestSchema.safeParse({
      action: "generate-concept-art",
      config: {
        prompt: "A bronze sword",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates batch action", () => {
    const result = GenerationRequestSchema.safeParse({
      action: "batch",
      config: {
        prompt: "A bronze sword",
      },
      count: 5,
    });
    expect(result.success).toBe(true);
  });

  it("validates status action", () => {
    const result = GenerationRequestSchema.safeParse({
      action: "status",
      taskId: "task-123",
    });
    expect(result.success).toBe(true);
  });
});
