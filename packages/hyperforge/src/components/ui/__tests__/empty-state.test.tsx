/**
 * EmptyState Component Tests
 *
 * Tests for the empty state component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmptyState } from "../empty-state";
import { Package } from "lucide-react";

describe("EmptyState", () => {
  it("renders without crashing", () => {
    render(
      <EmptyState
        icon={Package}
        title="No items"
        description="No items found"
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
