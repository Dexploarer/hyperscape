/**
 * RegenerateOptions Component Tests
 *
 * Tests for the regenerate options component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RegenerateOptions } from "../RegenerateOptions";
import type { AssetData } from "@/types/asset";

describe("RegenerateOptions", () => {
  it("renders without crashing", () => {
    const asset: AssetData = {
      id: "test-asset",
      name: "Test Asset",
      source: "LOCAL",
      category: "weapon",
      status: "completed",
      hasModel: true,
      modelUrl: "/models/test-asset.glb",
      metadata: {
        prompt: "Test prompt",
        pipeline: "text-to-3d",
        quality: "medium",
        generatedAt: new Date().toISOString(),
      },
    };

    const { container } = render(
      <RegenerateOptions asset={asset} />,
    );
    expect(container).toBeTruthy();
  });
});
