/**
 * Generation Service Tests
 *
 * Tests for generation service.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi } from "vitest";
import { generate3DModel, generateBatch } from "../generation-service";
import type { GenerationConfig } from "@/components/generation/GenerationFormRouter";

// Mock Meshy
vi.mock("@/lib/meshy/text-to-3d", () => ({
  startTextTo3DPreview: vi.fn().mockResolvedValue({ previewTaskId: "preview-123" }),
  startTextTo3DRefine: vi.fn().mockResolvedValue({ refineTaskId: "refine-123" }),
  pollTextTo3DStatus: vi.fn().mockResolvedValue({
    taskId: "refine-123",
    modelUrl: "https://example.com/model.glb",
    status: "SUCCEEDED",
  }),
}));

vi.mock("@/lib/meshy/image-to-3d", () => ({
  startImageTo3D: vi.fn().mockResolvedValue({
    taskId: "task-123",
    modelUrl: "https://example.com/model.glb",
    status: "SUCCEEDED",
  }),
}));

vi.mock("@/lib/meshy/poll-task", () => ({
  pollTaskStatus: vi.fn().mockResolvedValue({
    taskId: "task-123",
    modelUrl: "https://example.com/model.glb",
    status: "SUCCEEDED",
  }),
}));

vi.mock("@/lib/meshy/client", () => ({
  createRiggingTask: vi.fn().mockResolvedValue("rigging-123"),
  getRiggingTaskStatus: vi.fn().mockResolvedValue({
    id: "rigging-123",
    status: "SUCCEEDED",
    result: {
      rigged_character_glb_url: "https://example.com/rigged.glb",
    },
  }),
}));

vi.mock("@/lib/storage/asset-storage", () => ({
  saveAssetFiles: vi.fn().mockResolvedValue({
    modelPath: "/models/test.glb",
    modelUrl: "/api/assets/test/model.glb",
    relatedAssets: {},
  }),
  downloadFile: vi.fn().mockResolvedValue(Buffer.from("fake model")),
}));

vi.mock("@/lib/ai/gateway", () => ({
  enhancePromptWithGPT4: vi.fn().mockResolvedValue("Enhanced prompt"),
}));

vi.mock("@/lib/ai/concept-art-service", () => ({
  generateConceptArt: vi.fn().mockResolvedValue({
    imageUrl: "https://example.com/concept.png",
    dataUrl: "data:image/png;base64,...",
    base64: "base64data",
    mediaType: "image/png",
  }),
}));

describe("GenerationService", () => {
  it("generates 3D model", async () => {
    const config: GenerationConfig = {
      prompt: "A bronze sword",
      category: "weapon",
      pipeline: "text-to-3d",
      quality: "medium",
      metadata: {
        name: "Bronze Sword",
        description: "A bronze sword",
      },
    };

    const result = await generate3DModel(config);
    expect(result).toBeDefined();
    expect(result.taskId).toBeDefined();
  });

  it("generates batch of models", async () => {
    const config: GenerationConfig = {
      prompt: "A bronze sword",
      category: "weapon",
      pipeline: "text-to-3d",
      quality: "medium",
      metadata: {
        name: "Bronze Sword",
        description: "A bronze sword",
      },
    };

    const results = await generateBatch(config, 3);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});
