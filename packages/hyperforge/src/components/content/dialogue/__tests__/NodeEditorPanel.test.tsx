/**
 * NodeEditorPanel Component Tests
 *
 * Tests for the node editor panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { NodeEditorPanel, type NodeEditorPanelProps } from "../NodeEditorPanel";

describe("NodeEditorPanel", () => {
  it("renders without crashing", () => {
    const props: NodeEditorPanelProps = {
      editingNode: null,
      nodeAudio: new Map(),
      selectedVoice: "",
      isGeneratingAudio: false,
      isPlayingAudio: false,
      playingNodeId: null,
      onUpdateText: vi.fn(),
      onAddResponse: vi.fn(),
      onUpdateResponse: vi.fn(),
      onDeleteResponse: vi.fn(),
      onUpdateNode: vi.fn(),
      onGenerateAudio: vi.fn(),
      onPlayAudio: vi.fn(),
    };

    const { container } = render(<NodeEditorPanel {...props} />);
    expect(container).toBeTruthy();
  });
});
