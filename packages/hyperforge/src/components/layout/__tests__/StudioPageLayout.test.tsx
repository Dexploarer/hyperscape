/**
 * StudioPageLayout Component Tests
 *
 * Tests for the studio page layout component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StudioPageLayout } from "../StudioPageLayout";

describe("StudioPageLayout", () => {
  it("renders without crashing", () => {
    render(
      <StudioPageLayout title="Test Page">
        <div>Test content</div>
      </StudioPageLayout>,
    );
    expect(document.body).toBeTruthy();
  });
});
