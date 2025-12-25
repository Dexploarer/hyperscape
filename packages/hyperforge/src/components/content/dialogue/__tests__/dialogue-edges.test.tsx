import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ResponseEdge, EffectEdge, dialogueEdgeTypes } from "../dialogue-edges";
import { ReactFlowProvider, type Position } from "@xyflow/react";

// Mock ReactFlow
vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual("@xyflow/react");
  return {
    ...actual,
    useReactFlow: () => ({
      setEdges: vi.fn(),
    }),
    BaseEdge: ({ path }: { path: string }) => <path d={path} />,
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    getBezierPath: () => ["M 0 0 L 100 100", 50, 50],
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("DialogueEdges", () => {
  const defaultEdgeProps = {
    id: "edge-1",
    source: "node-1",
    target: "node-2",
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: "top" as Position,
    targetPosition: "bottom" as Position,
    selected: false,
    markerEnd: undefined,
  };

  it("renders ResponseEdge", () => {
    const { container } = render(
      <ResponseEdge
        {...defaultEdgeProps}
        data={{ label: "Test Response", responseIndex: 0 }}
      />,
      { wrapper },
    );
    expect(container).toBeTruthy();
  });

  it("renders ResponseEdge with effect", () => {
    const { container } = render(
      <ResponseEdge
        {...defaultEdgeProps}
        data={{ label: "Test", effect: "damage", responseIndex: 0 }}
      />,
      { wrapper },
    );
    expect(container).toBeTruthy();
  });

  it("renders EffectEdge", () => {
    const { container } = render(
      <EffectEdge
        {...defaultEdgeProps}
        data={{ effect: "heal", label: "Heal", responseIndex: 0 }}
      />,
      { wrapper },
    );
    expect(container).toBeTruthy();
  });

  it("exports dialogueEdgeTypes registry", () => {
    expect(dialogueEdgeTypes).toHaveProperty("response");
    expect(dialogueEdgeTypes).toHaveProperty("effect");
  });
});
