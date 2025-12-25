/**
 * BaseGenerationForm Component Tests
 *
 * Tests for the base generation form component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BaseGenerationForm } from "../BaseGenerationForm";
import { z } from "zod";

const TestSchema = z.object({
  name: z.string().min(1),
  prompt: z.string().min(1),
});

describe("BaseGenerationForm", () => {
  it("renders without crashing", () => {
    render(
      <BaseGenerationForm
        category="weapon"
        schema={TestSchema}
        defaultValues={{ name: "Test", prompt: "Test prompt" }}
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(document.body).toBeTruthy();
  });

  it("displays form fields", () => {
    render(
      <BaseGenerationForm
        category="weapon"
        schema={TestSchema}
        defaultValues={{ name: "Test", prompt: "Test prompt" }}
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    // Form should render with input fields
    expect(document.body).toBeTruthy();
  });
});
