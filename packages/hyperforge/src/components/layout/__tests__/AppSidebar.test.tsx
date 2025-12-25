/**
 * AppSidebar Component Tests
 *
 * Tests for the app sidebar component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AppSidebar } from "../AppSidebar";

describe("AppSidebar", () => {
  it("renders without crashing", () => {
    render(
      <AppSidebar collapsed={false} onToggleCollapse={vi.fn()} />,
    );
    expect(document.body).toBeTruthy();
  });
});
