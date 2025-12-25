/**
 * SidebarItem Component Tests
 *
 * Tests for the sidebar item component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SidebarItem } from "../sidebar-item";
import { Package } from "lucide-react";

describe("SidebarItem", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <SidebarItem
        icon={<Package className="w-4 h-4" />}
        label="Test Item"
        href="/test"
        isActive={false}
      />,
    );
    expect(container).toBeTruthy();
  });
});
