/**
 * AssetLibrary Component Tests
 *
 * Tests for the asset library component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AssetLibrary } from "../AssetLibrary";

describe("AssetLibrary", () => {
  it("renders without crashing", () => {
    render(<AssetLibrary />);
    expect(document.body).toBeTruthy();
  });
});
