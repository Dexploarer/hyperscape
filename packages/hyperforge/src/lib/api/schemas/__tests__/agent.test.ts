/**
 * Agent Schemas Tests
 *
 * Tests for agent API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  AgentRequestSchema,
  AgentGenerate3DSchema,
  AgentGenerateImageSchema,
  AgentListAssetsSchema,
} from "../agent";

describe("AgentSchemas", () => {
  it("validates agent request", () => {
    const result = AgentRequestSchema.safeParse({
      action: "generate-3d",
      params: {},
    });
    expect(result.success).toBe(true);
  });

  it("validates generate 3D action", () => {
    const result = AgentGenerate3DSchema.safeParse({
      action: "generate-3d",
      params: {
        prompt: "A bronze sword",
        mode: "text",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates generate image action", () => {
    const result = AgentGenerateImageSchema.safeParse({
      action: "generate-image",
      params: {
        prompt: "A bronze sword",
        type: "concept",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates list assets action", () => {
    const result = AgentListAssetsSchema.safeParse({
      action: "list-assets",
      params: {
        category: "weapon",
      },
    });
    expect(result.success).toBe(true);
  });
});
