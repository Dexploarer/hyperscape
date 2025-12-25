/**
 * ResourceGenerationForm Component Tests
 *
 * Tests for the resource generation form component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ResourceGenerationForm } from "../ResourceGenerationForm";

describe("ResourceGenerationForm", () => {
  it("renders without crashing", () => {
    render(
      <ResourceGenerationForm
        onGenerate={async () => ({ success: true })}
        onCancel={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
