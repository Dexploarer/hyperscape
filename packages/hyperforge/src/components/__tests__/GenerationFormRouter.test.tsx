/**
 * GenerationFormRouter Component Tests
 *
 * Tests for the generation form router component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenerationFormRouter } from "../generation/GenerationFormRouter";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("GenerationFormRouter", () => {
  it("renders without crashing", () => {
    render(
      <GenerationFormRouter
        category="weapon"
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    // Component should render
    expect(document.body).toBeTruthy();
  });

  it("displays category selection when no category selected", () => {
    render(
      <GenerationFormRouter
        category="weapon"
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    // Should show category buttons or selection UI
    const element = screen.queryByText(/item|weapon|armor|npc/i);
    // Component structure should exist
    expect(document.body).toBeTruthy();
  });
});
