/**
 * Modal Component Tests
 *
 * Tests for the modal component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Modal } from "../modal";

describe("Modal", () => {
  it("renders without crashing", () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>,
    );
    expect(document.body).toBeTruthy();
  });
});
