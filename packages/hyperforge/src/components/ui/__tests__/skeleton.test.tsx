/**
 * Skeleton Component Tests
 *
 * Tests for the skeleton loading component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "../skeleton";

describe("Skeleton", () => {
  it("renders without crashing", () => {
    render(<Skeleton className="w-32 h-32" />);
    expect(document.body).toBeTruthy();
  });
});
