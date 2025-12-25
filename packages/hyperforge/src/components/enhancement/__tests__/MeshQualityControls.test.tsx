/**
 * MeshQualityControls Component Tests
 *
 * Tests for the mesh quality controls component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MeshQualityControls, type MeshQualitySettings } from "../MeshQualityControls";

describe("MeshQualityControls", () => {
  it("renders without crashing", () => {
    const value: MeshQualitySettings = {
      assetClass: "small_prop",
      targetPolycount: 500,
      topology: "triangle",
      shouldRemesh: false,
      enablePBR: true,
    };

    const { container } = render(
      <MeshQualityControls
        value={value}
        onChange={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });
});
