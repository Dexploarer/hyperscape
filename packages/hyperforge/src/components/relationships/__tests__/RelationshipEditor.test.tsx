/**
 * RelationshipEditor Component Tests
 *
 * Tests for the relationship editor component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RelationshipEditor } from "../RelationshipEditor";

describe("RelationshipEditor", () => {
  it("renders without crashing", () => {
    render(
      <RelationshipEditor
        assetId="test-asset"
        assetName="Test Asset"
        assetCategory="weapon"
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
