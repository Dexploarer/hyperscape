import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommandPalette } from "../command-palette";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("does not render when closed", () => {
    render(<CommandPalette />);
    expect(screen.queryByPlaceholderText(/Search commands/)).toBeNull();
  });

  it("opens with Ctrl+P or Cmd+P", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: "p", ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search commands/)).toBeTruthy();
    });
  });

  it("closes with Escape key", async () => {
    render(<CommandPalette />);
    
    // Open palette
    fireEvent.keyDown(document, { key: "p", ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search commands/)).toBeTruthy();
    });
    
    // Close palette
    fireEvent.keyDown(document, { key: "Escape" });
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Search commands/)).toBeNull();
    });
  });

  it("filters commands by search query", async () => {
    render(<CommandPalette />);
    
    // Open palette
    fireEvent.keyDown(document, { key: "p", ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search commands/)).toBeTruthy();
    });
    
    const input = screen.getByPlaceholderText(/Search commands/);
    fireEvent.change(input, { target: { value: "generate" } });
    
    // Should show generation-related commands
    await waitFor(() => {
      expect(screen.getByText(/Generate/i)).toBeTruthy();
    });
  });

  it("displays navigation commands", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: "p", ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByText(/Navigation/i)).toBeTruthy();
    });
  });

  it("displays action commands", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: "p", ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByText(/Actions/i)).toBeTruthy();
    });
  });
});
