/**
 * Spinner Component Tests
 *
 * Tests for the spinner component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spinner } from "../spinner";

describe("Spinner", () => {
  it("renders without crashing", () => {
    render(<Spinner />);
    expect(document.body).toBeTruthy();
  });
});
