/**
 * PropGenerationForm Component Tests
 *
 * Tests for the prop generation form component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PropGenerationForm } from "../PropGenerationForm";

describe("PropGenerationForm", () => {
  it("renders without crashing", () => {
    render(
      <PropGenerationForm
        onGenerate={async () => ({ success: true })}
        onCancel={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
