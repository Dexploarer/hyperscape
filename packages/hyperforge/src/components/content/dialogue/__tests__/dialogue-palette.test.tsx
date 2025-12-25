import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DialoguePalette } from "../dialogue-palette";

describe("DialoguePalette", () => {
  it("renders without crashing", () => {
    render(<DialoguePalette />);
    expect(screen.getByText("Drag to Add")).toBeTruthy();
  });

  it("displays dialogue node option", () => {
    render(<DialoguePalette />);
    expect(screen.getByText("Dialogue Node")).toBeTruthy();
    expect(screen.getByText("NPC speech with responses")).toBeTruthy();
  });

  it("displays end node option", () => {
    render(<DialoguePalette />);
    expect(screen.getByText("End Node")).toBeTruthy();
    expect(screen.getByText("Terminate conversation")).toBeTruthy();
  });

  it("makes items draggable", () => {
    render(<DialoguePalette />);
    const dialogueNode = screen.getByText("Dialogue Node").closest("div");
    expect(dialogueNode?.getAttribute("draggable")).toBe("true");
  });

  it("applies custom className", () => {
    const { container } = render(<DialoguePalette className="custom-class" />);
    const first = container.firstChild as HTMLElement | null;
    expect(first?.classList.contains("custom-class")).toBe(true);
  });
});
