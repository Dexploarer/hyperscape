/**
 * BuildingGenerationForm Component Tests
 *
 * Tests for the building generation form component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BuildingGenerationForm } from "../BuildingGenerationForm";

describe("BuildingGenerationForm", () => {
  it("renders without crashing", () => {
    render(
      <BuildingGenerationForm
        onGenerate={async () => ({ success: true })}
        onCancel={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
