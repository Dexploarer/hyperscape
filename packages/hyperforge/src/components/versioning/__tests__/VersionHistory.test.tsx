/**
 * VersionHistory Component Tests
 *
 * Tests for the version history component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { VersionHistory } from "../VersionHistory";

describe("VersionHistory", () => {
  it("renders without crashing", () => {
    render(
      <VersionHistory
        assetId="test-asset"
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
