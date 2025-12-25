/**
 * PromptInput Component Tests
 *
 * Tests for the prompt input component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PromptInput } from "../PromptInput";

describe("PromptInput", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <PromptInput
        value=""
        onChange={() => {}}
      />,
    );
    expect(container).toBeTruthy();
  });
});
