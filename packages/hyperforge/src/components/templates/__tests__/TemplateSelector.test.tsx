/**
 * TemplateSelector Component Tests
 *
 * Tests for the template selector component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { TemplateSelector } from "../TemplateSelector";

describe("TemplateSelector", () => {
  it("renders without crashing", () => {
    const { container } = render(<TemplateSelector />);
    expect(container).toBeTruthy();
  });
});
