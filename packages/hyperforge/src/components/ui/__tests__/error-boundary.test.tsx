/**
 * ErrorBoundary Component Tests
 *
 * Tests for the error boundary component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ErrorBoundary } from "../error-boundary";

describe("ErrorBoundary", () => {
  it("renders without crashing", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );
    expect(document.body).toBeTruthy();
  });
});
