/**
 * AssetCreationWizard Component Tests
 *
 * Tests for the asset creation wizard component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AssetCreationWizard } from "../AssetCreationWizard";

describe("AssetCreationWizard", () => {
  it("renders without crashing", () => {
    render(
      <AssetCreationWizard
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
