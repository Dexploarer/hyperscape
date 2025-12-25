/**
 * Badge Component Tests
 *
 * Tests for the badge component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders without crashing", () => {
    render(<Badge>Test Badge</Badge>);
    expect(document.body).toBeTruthy();
  });
});
