/**
 * EnvironmentGenerationForm Component Tests
 *
 * Tests for the environment generation form component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EnvironmentGenerationForm } from "../EnvironmentGenerationForm";

describe("EnvironmentGenerationForm", () => {
  it("renders without crashing", () => {
    render(
      <EnvironmentGenerationForm
        onGenerate={async () => ({ success: true })}
        onCancel={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
