/**
 * DialogueToolbar Component Tests
 *
 * Tests for the dialogue toolbar component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { DialogueToolbar } from "../DialogueToolbar";

describe("DialogueToolbar", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <DialogueToolbar
        onAddNode={vi.fn()}
        onSave={() => {}}
        onGenerate={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={false}
        canRedo={false}
        onAutoLayout={vi.fn()}
        layoutDirection="TB"
        onLayoutDirectionChange={vi.fn()}
        onFitView={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
