/**
 * BatchGenerator Component Tests
 *
 * Tests for the batch generator component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BatchGenerator } from "../BatchGenerator";
import type { GenerationConfig } from "../GenerationFormRouter";

describe("BatchGenerator", () => {
  it("renders without crashing", () => {
    const baseConfig: GenerationConfig = {
      category: "weapon",
      prompt: "Test prompt",
      pipeline: "text-to-3d",
      quality: "medium",
      metadata: {
        name: "Test",
        description: "Test description",
      },
    };

    const { container } = render(
      <BatchGenerator
        baseConfig={baseConfig}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
