import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewportShortcuts } from "../ViewportShortcuts";

// Mock Modal component
vi.mock("@/components/ui/modal", () => ({
  Modal: ({ isOpen, onClose, title, children }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

describe("ViewportShortcuts", () => {
  it("renders without crashing", () => {
    render(<ViewportShortcuts />);
    expect(screen.getByText("Shortcuts")).toBeTruthy();
  });

  it("opens modal when button is clicked", () => {
    render(<ViewportShortcuts />);
    
    const button = screen.getByText("Shortcuts");
    fireEvent.click(button);
    
    expect(screen.getByTestId("modal")).toBeTruthy();
    expect(screen.getByText("Keyboard Shortcuts")).toBeTruthy();
  });

  it("displays all shortcuts", () => {
    render(<ViewportShortcuts />);
    
    const button = screen.getByText("Shortcuts");
    fireEvent.click(button);
    
    expect(screen.getByText("Focus on model")).toBeTruthy();
    expect(screen.getByText("Toggle shadows")).toBeTruthy();
    expect(screen.getByText("Toggle grid")).toBeTruthy();
    expect(screen.getByText("Reset camera")).toBeTruthy();
    expect(screen.getByText("Play animation")).toBeTruthy();
  });

  it("closes modal when close button is clicked", () => {
    render(<ViewportShortcuts />);
    
    const button = screen.getByText("Shortcuts");
    fireEvent.click(button);
    
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId("modal")).toBeNull();
  });
});
