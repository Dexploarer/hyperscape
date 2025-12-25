/**
 * RelationshipEdge Component Tests
 *
 * Tests for the relationship edge component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { RelationshipEdge } from "../RelationshipEdge";
import type { Position } from "@xyflow/react";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("RelationshipEdge", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <RelationshipEdge
        id="test-edge"
        source="source-id"
        target="target-id"
        sourceX={0}
        sourceY={0}
        targetX={100}
        targetY={100}
        sourcePosition={"top" as Position}
        targetPosition={"bottom" as Position}
        data={{
          relationshipType: "drops",
          label: "Drops",
        }}
        selected={false}
      />,
      { wrapper },
    );
    expect(container).toBeTruthy();
  });
});
