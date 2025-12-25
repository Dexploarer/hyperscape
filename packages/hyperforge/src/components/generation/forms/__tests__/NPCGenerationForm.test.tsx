/**
 * NPCGenerationForm Component Tests
 *
 * Tests for the NPC generation form component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NPCGenerationForm } from "../NPCGenerationForm";

describe("NPCGenerationForm", () => {
  it("renders without crashing", () => {
    render(
      <NPCGenerationForm
        onGenerate={async () => ({ success: true })}
        onCancel={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
