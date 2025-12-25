/**
 * GraphNode Component Tests
 *
 * Tests for the graph node component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { AssetNode, type AssetNodeData } from "../GraphNode";
import type { NodeProps } from "@xyflow/react";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("AssetNode", () => {
  it("renders without crashing", () => {
    const data: AssetNodeData = {
      id: "test-node",
      name: "Test Node",
      category: "weapon",
      relationshipCount: 0,
    };

    const nodeProps = {
      id: "test-node",
      type: "asset",
      position: { x: 0, y: 0 },
      data,
      selected: false,
      dragging: false,
      zIndex: 0,
      selectable: true,
      deletable: false,
      draggable: true,
    } as unknown as NodeProps & { data: AssetNodeData };

    const { container } = render(<AssetNode {...nodeProps} />, { wrapper });
    expect(container).toBeTruthy();
  });
});
