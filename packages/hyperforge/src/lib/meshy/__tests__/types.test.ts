/**
 * Meshy Types Tests
 *
 * Tests for Meshy API types.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import type {
  MeshyAIModel,
  MeshTopology,
  MeshyArtStyle,
  MeshySymmetryMode,
  MeshyPoseMode,
  MeshyTask,
  ImageTo3DOptions,
  TextTo3DOptions,
} from "../types";

describe("MeshyTypes", () => {
  it("defines valid AI model types", () => {
    const models: MeshyAIModel[] = ["meshy-4", "meshy-5", "meshy-6", "latest"];
    models.forEach((model) => {
      expect(typeof model).toBe("string");
    });
  });

  it("defines valid topology types", () => {
    const topologies: MeshTopology[] = ["quad", "triangle"];
    topologies.forEach((topology) => {
      expect(typeof topology).toBe("string");
    });
  });

  it("defines valid art styles", () => {
    const styles: MeshyArtStyle[] = ["realistic", "sculpture"];
    styles.forEach((style) => {
      expect(typeof style).toBe("string");
    });
  });

  it("defines valid symmetry modes", () => {
    const modes: MeshySymmetryMode[] = ["off", "auto", "on"];
    modes.forEach((mode) => {
      expect(typeof mode).toBe("string");
    });
  });

  it("defines valid pose modes", () => {
    const modes: MeshyPoseMode[] = ["a-pose", "t-pose", ""];
    modes.forEach((mode) => {
      expect(typeof mode).toBe("string");
    });
  });

  it("defines task structure", () => {
    const task: MeshyTask = {
      id: "task-123",
      status: "SUCCEEDED",
      model_urls: {
        glb: "https://example.com/model.glb",
      },
    };

    expect(task.id).toBe("task-123");
    expect(task.status).toBe("SUCCEEDED");
  });

  it("defines image-to-3D options", () => {
    const options: ImageTo3DOptions = {
      image_url: "https://example.com/image.png",
      enable_pbr: true,
      topology: "triangle",
      target_polycount: 2000,
    };

    expect(options.image_url).toBeDefined();
    expect(options.enable_pbr).toBe(true);
  });

  it("defines text-to-3D options", () => {
    const options: TextTo3DOptions = {
      prompt: "A bronze sword",
      art_style: "realistic",
      topology: "triangle",
      target_polycount: 2000,
    };

    expect(options.prompt).toBe("A bronze sword");
    expect(options.art_style).toBe("realistic");
  });
});
