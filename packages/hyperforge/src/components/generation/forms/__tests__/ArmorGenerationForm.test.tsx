/**
 * ArmorGenerationForm Component Tests
 *
 * Tests for the armor generation form component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ArmorGenerationForm } from "../ArmorGenerationForm";

describe("ArmorGenerationForm", () => {
  it("renders without crashing", () => {
    render(
      <ArmorGenerationForm
        onGenerate={async () => ({ success: true })}
        onCancel={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
