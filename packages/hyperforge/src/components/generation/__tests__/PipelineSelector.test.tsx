/**
 * PipelineSelector Component Tests
 *
 * Tests for the pipeline selector component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PipelineSelector } from "../PipelineSelector";

describe("PipelineSelector", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <PipelineSelector
        value="text-to-3d"
        onChange={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });
});
