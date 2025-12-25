/**
 * AssetLibrarySidebar Component Tests
 *
 * Tests for the asset library sidebar component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AssetLibrarySidebar } from "../AssetLibrarySidebar";

describe("AssetLibrarySidebar", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <AssetLibrarySidebar
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
