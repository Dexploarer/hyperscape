/**
 * QuestGenerator Component Tests
 *
 * Tests for the quest generator component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { QuestGenerator } from "../QuestGenerator";

describe("QuestGenerator", () => {
  it("renders without crashing", () => {
    const { container } = render(<QuestGenerator />);
    expect(container).toBeTruthy();
  });
});
