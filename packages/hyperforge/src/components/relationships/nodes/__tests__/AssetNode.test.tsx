/**
 * AssetNode Component Tests
 *
 * Tests for the asset node component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { AssetNode } from "../AssetNode";
import type { NodeProps } from "@xyflow/react";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("AssetNode", () => {
  it("renders without crashing", () => {
    const data = {
      id: "test-asset",
      name: "Test Asset",
      category: "weapon" as const,
      relationshipCount: 0,
      isSelected: false,
      onClick: () => {},
    };

    const nodeProps = {
      id: "test-asset",
      type: "asset",
      position: { x: 0, y: 0 },
      data,
      selected: false,
      dragging: false,
      zIndex: 0,
      selectable: true,
      deletable: false,
      draggable: true,
    } as unknown as NodeProps & { data: typeof data };

    const { container } = render(<AssetNode {...nodeProps} />, { wrapper });
    expect(container).toBeTruthy();
  });
});
