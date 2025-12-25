/**
 * EntityPalette Component Tests
 *
 * Tests for the entity palette component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { EntityPalette } from "../EntityPalette";
import type { AssetData } from "@/types/asset";

describe("EntityPalette", () => {
  it("renders without crashing", () => {
    const assets: AssetData[] = [];
    render(
      <EntityPalette
        assets={assets}
        onAssetDrag={vi.fn()}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
