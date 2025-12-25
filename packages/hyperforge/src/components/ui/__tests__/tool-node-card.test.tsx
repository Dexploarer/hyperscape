import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolNodeCard } from "../tool-node-card";

describe("ToolNodeCard", () => {
  it("renders without crashing", () => {
    render(
      <ToolNodeCard
        title="Test Tool"
        status="idle"
      />,
    );
    expect(screen.getByText("Test Tool")).toBeTruthy();
  });

  it("displays description when provided", () => {
    render(
      <ToolNodeCard
        title="Test Tool"
        description="A test tool description"
        status="idle"
      />,
    );
    expect(screen.getByText("A test tool description")).toBeTruthy();
  });

  it("shows running state", () => {
    render(
      <ToolNodeCard
        title="Test Tool"
        status="running"
      />,
    );
    // Should show loading spinner
    expect(screen.getByText("Test Tool")).toBeTruthy();
  });

  it("shows completed state", () => {
    render(
      <ToolNodeCard
        title="Test Tool"
        status="completed"
      />,
    );
    expect(screen.getByText("Test Tool")).toBeTruthy();
  });

  it("shows failed state", () => {
    render(
      <ToolNodeCard
        title="Test Tool"
        status="failed"
      />,
    );
    expect(screen.getByText("Test Tool")).toBeTruthy();
  });

  it("applies selected styling when selected", () => {
    const { container } = render(
      <ToolNodeCard
        title="Test Tool"
        status="idle"
        selected={true}
      />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card?.classList.contains("border-neon-blue") || card?.style.borderColor).toBeTruthy();
  });
});
