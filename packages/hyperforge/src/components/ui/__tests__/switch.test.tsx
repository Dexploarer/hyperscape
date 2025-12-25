/**
 * Switch Component Tests
 *
 * Tests for the switch component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Switch } from "../switch";

describe("Switch", () => {
  it("renders without crashing", () => {
    render(
      <Switch
        checked={false}
        onCheckedChange={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
