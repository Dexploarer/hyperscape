/**
 * NPCContentGenerator Component Tests
 *
 * Tests for the NPC content generator component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NPCContentGenerator } from "../NPCContentGenerator";

describe("NPCContentGenerator", () => {
  it("renders without crashing", () => {
    render(<NPCContentGenerator />);
    expect(document.body).toBeTruthy();
  });
});
