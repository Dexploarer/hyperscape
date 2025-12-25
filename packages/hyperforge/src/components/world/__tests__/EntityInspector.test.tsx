/**
 * EntityInspector Component Tests
 *
 * Tests for the entity inspector component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { EntityInspector } from "../EntityInspector";
import type { WorldEntity } from "../WorldView";

describe("EntityInspector", () => {
  it("renders without crashing", () => {
    const entity: WorldEntity = {
      id: "test-entity",
      name: "Test Entity",
      type: "npc",
      position: { x: 0, y: 0, z: 0 },
    };
    const { container } = render(
      <EntityInspector
        entity={entity}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onTestInGame={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
