/**
 * SaveOptionsPanel Component Tests
 *
 * Tests for the save options panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { SaveOptionsPanel } from "../SaveOptionsPanel";

describe("SaveOptionsPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <SaveOptionsPanel
        saveOptions={{
          saveBaseMesh: true,
          saveTexturedModel: true,
          saveVariants: false,
        }}
        onSaveOptionsChange={vi.fn()}
        generateConceptArt={false}
        onGenerateConceptArtChange={vi.fn()}
        useConceptArtForTexturing={false}
        onUseConceptArtForTexturingChange={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
