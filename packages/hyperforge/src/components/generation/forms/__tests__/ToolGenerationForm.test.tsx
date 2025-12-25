/**
 * ToolGenerationForm Component Tests
 *
 * Tests for the tool generation form component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ToolGenerationForm } from "../ToolGenerationForm";

describe("ToolGenerationForm", () => {
  it("renders without crashing", () => {
    render(
      <ToolGenerationForm
        onGenerate={async () => ({ success: true })}
        onCancel={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
