/**
 * EquipmentViewer Component Tests
 *
 * Tests for the equipment viewer component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EquipmentViewer } from "../EquipmentViewer";

describe("EquipmentViewer", () => {
  it("renders without crashing", () => {
    render(<EquipmentViewer />);
    expect(document.body).toBeTruthy();
  });
});
