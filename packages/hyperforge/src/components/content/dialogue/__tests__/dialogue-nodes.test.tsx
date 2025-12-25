import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DialogueNode,
  EndNode,
  dialogueNodeTypes,
  type DialogueNodeData,
  type EndNodeData,
} from "../dialogue-nodes";
import { ReactFlowProvider } from "@xyflow/react";

// Mock ReactFlow
vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual("@xyflow/react");
  return {
    ...actual,
    Handle: ({ position }: { position: string }) => (
      <div data-testid={`handle-${position}`} />
    ),
    NodeToolbar: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="node-toolbar">{children}</div>
    ),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("DialogueNodes", () => {
  const defaultDialogueNodeData: DialogueNodeData = {
    label: "Node 1",
    text: "Hello, adventurer!",
    responses: [
      { text: "Hello!", effect: undefined, nextNodeId: "end" },
      { text: "Goodbye", effect: undefined, nextNodeId: "end" },
    ],
    isEntry: false,
    hasAudio: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    onSetEntry: vi.fn(),
    onGenerateAudio: vi.fn(),
    onPlayAudio: vi.fn(),
  };

  it("renders DialogueNode", () => {
    render(<DialogueNode data={defaultDialogueNodeData} selected={false} />, {
      wrapper,
    });
    expect(screen.getByText("Node 1")).toBeTruthy();
    expect(screen.getByText("Hello, adventurer!")).toBeTruthy();
  });

  it("shows responses when expanded", () => {
    render(<DialogueNode data={defaultDialogueNodeData} selected={false} />, {
      wrapper,
    });
    expect(screen.getByText("Hello!")).toBeTruthy();
    expect(screen.getByText("Goodbye")).toBeTruthy();
  });

  it("shows entry badge when isEntry is true", () => {
    render(
      <DialogueNode
        data={{ ...defaultDialogueNodeData, isEntry: true }}
        selected={false}
      />,
      { wrapper },
    );
    expect(screen.getByText("ENTRY")).toBeTruthy();
  });

  it("shows audio indicator when hasAudio is true", () => {
    render(
      <DialogueNode
        data={{ ...defaultDialogueNodeData, hasAudio: true }}
        selected={false}
      />,
      { wrapper },
    );
    // Audio indicator should be present
    expect(screen.getByTestId("node-toolbar")).toBeTruthy();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(
      <DialogueNode
        data={{ ...defaultDialogueNodeData, onEdit }}
        selected={true}
      />,
      { wrapper },
    );
    
    const editButton = screen.getByTitle("Edit Node");
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalled();
  });

  it("renders EndNode", () => {
    const endNodeData: EndNodeData = {
      label: "End",
      text: "The end",
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    
    render(<EndNode data={endNodeData} selected={false} />, {
      wrapper,
    });
    expect(screen.getByText("End")).toBeTruthy();
    expect(screen.getByText("The end")).toBeTruthy();
  });

  it("exports dialogueNodeTypes registry", () => {
    expect(dialogueNodeTypes).toHaveProperty("dialogue");
    expect(dialogueNodeTypes).toHaveProperty("end");
  });
});
