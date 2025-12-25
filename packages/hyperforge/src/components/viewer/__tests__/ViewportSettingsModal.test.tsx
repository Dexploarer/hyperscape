/**
 * ViewportSettingsModal Component Tests
 *
 * Tests for the viewport settings modal component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ViewportSettingsModal, DEFAULT_VIEWPORT_SETTINGS } from "../ViewportSettingsModal";

describe("ViewportSettingsModal", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ViewportSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={DEFAULT_VIEWPORT_SETTINGS}
        onSettingsChange={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
