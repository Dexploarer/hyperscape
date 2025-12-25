/**
 * Toast Component Tests
 *
 * Tests for the toast component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ToastProvider } from "../toast";

describe("ToastProvider", () => {
  it("renders without crashing", () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>,
    );
    expect(document.body).toBeTruthy();
  });
});
