/**
 * VariantDefinitionPanel Component Tests
 *
 * Tests for the variant definition panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { VariantDefinitionPanel } from "../VariantDefinitionPanel";

describe("VariantDefinitionPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <VariantDefinitionPanel
        variants={[]}
        onVariantsChange={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });
});
