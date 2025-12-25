/**
 * RelationshipGraph Component Tests
 *
 * Tests for the relationship graph component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RelationshipGraph } from "../RelationshipGraph";
import type { RelationshipGraph as RelationshipGraphType } from "@/lib/relationships/relationship-types";

describe("RelationshipGraph", () => {
  it("renders without crashing", () => {
    const graph: RelationshipGraphType = {
      nodes: [],
      edges: [],
    };

    render(<RelationshipGraph graph={graph} />);
    expect(document.body).toBeTruthy();
  });
});
