/**
 * EnhancementPanel Component Tests
 *
 * Tests for the enhancement panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EnhancementPanel } from "../EnhancementPanel";
import type { AssetData } from "@/types/asset";

describe("EnhancementPanel", () => {
  it("renders without crashing", () => {
    const asset: AssetData = {
      id: "test-asset",
      name: "Test Sword",
      source: "LOCAL",
      category: "weapon",
      status: "completed",
      hasModel: true,
      modelUrl: "/models/test-sword.glb",
      metadata: {
        prompt: "A test sword",
        pipeline: "text-to-3d",
        quality: "medium",
        generatedAt: new Date().toISOString(),
      },
    };

    render(<EnhancementPanel asset={asset} onClose={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
