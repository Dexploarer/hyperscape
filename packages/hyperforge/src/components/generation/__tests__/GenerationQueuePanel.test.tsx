/**
 * GenerationQueuePanel Component Tests
 *
 * Tests for the generation queue panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { GenerationQueuePanel } from "../GenerationQueuePanel";

describe("GenerationQueuePanel", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <GenerationQueuePanel
        isOpen
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
