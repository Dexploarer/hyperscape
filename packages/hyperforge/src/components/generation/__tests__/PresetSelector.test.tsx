/**
 * PresetSelector Component Tests
 *
 * Tests for the preset selector component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { PresetSelector } from "../PresetSelector";
import type { GenerationConfig } from "../GenerationFormRouter";

describe("PresetSelector", () => {
  it("renders without crashing", () => {
    const mockConfig: GenerationConfig = {
      category: "weapon",
      prompt: "Test prompt",
      pipeline: "text-to-3d",
      quality: "medium",
      metadata: {
        name: "Test",
      },
    };

    const { container } = render(
      <PresetSelector
        category="weapon"
        currentConfig={mockConfig}
        onPresetSelect={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
