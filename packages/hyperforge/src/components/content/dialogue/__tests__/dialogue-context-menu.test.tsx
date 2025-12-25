import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DialogueContextMenu } from "../dialogue-context-menu";

describe("DialogueContextMenu", () => {
  const defaultProps = {
    isOpen: true,
    position: { x: 100, y: 100 },
    type: "canvas" as const,
    onClose: vi.fn(),
  };

  it("renders when open", () => {
    render(<DialogueContextMenu {...defaultProps} />);
    expect(screen.getByText("Add Dialogue Node")).toBeTruthy();
  });

  it("does not render when closed", () => {
    render(<DialogueContextMenu {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Add Dialogue Node")).toBeNull();
  });

  it("calls onClose when clicking outside", () => {
    const onClose = vi.fn();
    render(<DialogueContextMenu {...defaultProps} onClose={onClose} />);
    
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when pressing Escape", () => {
    const onClose = vi.fn();
    render(<DialogueContextMenu {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows canvas menu items for canvas type", () => {
    render(<DialogueContextMenu {...defaultProps} type="canvas" />);
    expect(screen.getByText("Add Dialogue Node")).toBeTruthy();
    expect(screen.getByText("Add End Node")).toBeTruthy();
    expect(screen.getByText("Auto Layout")).toBeTruthy();
  });

  it("shows node menu items for node type", () => {
    render(
      <DialogueContextMenu
        {...defaultProps}
        type="node"
        onEditNode={vi.fn()}
        onDeleteNode={vi.fn()}
      />,
    );
    expect(screen.getByText("Edit Node")).toBeTruthy();
    expect(screen.getByText("Delete Node")).toBeTruthy();
  });

  it("shows edge menu items for edge type", () => {
    render(
      <DialogueContextMenu
        {...defaultProps}
        type="edge"
        onEditEdge={vi.fn()}
        onDeleteEdge={vi.fn()}
      />,
    );
    expect(screen.getByText("Edit Response")).toBeTruthy();
    expect(screen.getByText("Delete Connection")).toBeTruthy();
  });

  it("calls action handlers when menu items are clicked", () => {
    const onAddDialogueNode = vi.fn();
    const onClose = vi.fn();
    
    render(
      <DialogueContextMenu
        {...defaultProps}
        type="canvas"
        onAddDialogueNode={onAddDialogueNode}
        onClose={onClose}
      />,
    );
    
    fireEvent.click(screen.getByText("Add Dialogue Node"));
    expect(onAddDialogueNode).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("disables entry node actions when isEntryNode is true", () => {
    render(
      <DialogueContextMenu
        {...defaultProps}
        type="node"
        isEntryNode={true}
        onSetAsEntry={vi.fn()}
        onDeleteNode={vi.fn()}
      />,
    );
    
    const setAsEntryButton = screen.getByText("Set as Entry").closest("button");
    const deleteButton = screen.getByText("Delete Node").closest("button");

    expect(setAsEntryButton?.hasAttribute("disabled")).toBe(true);
    expect(deleteButton?.hasAttribute("disabled")).toBe(true);
  });
});
