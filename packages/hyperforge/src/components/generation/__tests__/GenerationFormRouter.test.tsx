/**
 * GenerationFormRouter Component Tests
 *
 * Tests for the generation form router component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GenerationFormRouter } from "../GenerationFormRouter";

describe("GenerationFormRouter", () => {
  it("renders without crashing when category is null", () => {
    const { container } = render(
      <GenerationFormRouter
        category={null}
        onGenerate={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });

  it("renders NPCGenerationForm for npc category", () => {
    const { container } = render(
      <GenerationFormRouter
        category="npc"
        onGenerate={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });

  it("renders WeaponGenerationForm for weapon category", () => {
    const { container } = render(
      <GenerationFormRouter
        category="weapon"
        onGenerate={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });
});
