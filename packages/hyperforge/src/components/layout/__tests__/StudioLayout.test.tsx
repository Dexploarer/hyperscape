/**
 * StudioLayout Component Tests
 *
 * Tests for the studio layout component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StudioLayout } from "../StudioLayout";

describe("StudioLayout", () => {
  it("renders without crashing", () => {
    render(
      <StudioLayout>
        <div>Test content</div>
      </StudioLayout>,
    );
    expect(document.body).toBeTruthy();
  });
});
