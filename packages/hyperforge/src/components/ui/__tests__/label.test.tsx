/**
 * Label Component Tests
 *
 * Tests for the label component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Label } from "../label";

describe("Label", () => {
  it("renders without crashing", () => {
    render(<Label>Test Label</Label>);
    expect(document.body).toBeTruthy();
  });
});
