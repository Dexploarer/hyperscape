/**
 * CharacterEquipmentPanel Component Tests
 *
 * Tests for the character equipment panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CharacterEquipmentPanel } from "../CharacterEquipmentPanel";

describe("CharacterEquipmentPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<CharacterEquipmentPanel />);
    expect(container).toBeTruthy();
  });
});
