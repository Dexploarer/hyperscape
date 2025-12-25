import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatBubble } from "../chat-bubble";

describe("ChatBubble", () => {
  it("renders user message", () => {
    render(<ChatBubble role="user" content="Hello!" />);
    expect(screen.getByText("Hello!")).toBeTruthy();
  });

  it("renders assistant message", () => {
    render(<ChatBubble role="assistant" content="Hi there!" />);
    expect(screen.getByText("Hi there!")).toBeTruthy();
  });

  it("renders system message", () => {
    render(<ChatBubble role="system" content="System message" />);
    expect(screen.getByText("System message")).toBeTruthy();
  });

  it("applies correct styling for user messages", () => {
    const { container } = render(
      <ChatBubble role="user" content="Test" />,
    );
    const bubble = container.querySelector("div > div");
    expect(bubble?.classList.contains("justify-end")).toBe(true);
  });

  it("applies correct styling for assistant messages", () => {
    const { container } = render(
      <ChatBubble role="assistant" content="Test" />,
    );
    const bubble = container.querySelector("div > div");
    expect(bubble?.classList.contains("justify-start")).toBe(true);
  });
});
