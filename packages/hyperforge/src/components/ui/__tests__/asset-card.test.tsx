/**
 * AssetCard Component Tests
 *
 * Tests for the asset card component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AssetCard } from "../asset-card";

describe("AssetCard", () => {
  it("renders without crashing", () => {
    render(
      <AssetCard
        name="Test Asset"
        status="ready"
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
