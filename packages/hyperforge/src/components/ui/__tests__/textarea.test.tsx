/**
 * Textarea Component Tests
 *
 * Tests for the textarea component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Textarea } from "../textarea";

describe("Textarea", () => {
  it("renders without crashing", () => {
    render(<Textarea placeholder="Enter text" />);
    expect(document.body).toBeTruthy();
  });
});
