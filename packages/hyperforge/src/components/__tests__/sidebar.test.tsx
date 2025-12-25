/**
 * Sidebar Component Tests
 *
 * Tests for the sidebar component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Sidebar } from "../sidebar";

describe("Sidebar", () => {
  it("renders without crashing", () => {
    render(<Sidebar />);
    expect(document.body).toBeTruthy();
  });
});
