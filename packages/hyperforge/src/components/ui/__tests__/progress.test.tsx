/**
 * Progress Component Tests
 *
 * Tests for the progress component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Progress } from "../progress";

describe("Progress", () => {
  it("renders without crashing", () => {
    render(<Progress value={50} />);
    expect(document.body).toBeTruthy();
  });
});
