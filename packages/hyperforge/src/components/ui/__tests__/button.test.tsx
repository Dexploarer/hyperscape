/**
 * Button Component Tests
 *
 * Tests for the button component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpectacularButton } from "../spectacular-button";

describe("SpectacularButton", () => {
  it("renders without crashing", () => {
    render(<SpectacularButton>Click me</SpectacularButton>);
    expect(screen.getByText("Click me")).toBeTruthy();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<SpectacularButton onClick={handleClick}>Click me</SpectacularButton>);
    
    const button = screen.getByText("Click me");
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
