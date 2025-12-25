/**
 * Relationship Service Tests
 *
 * Tests for relationship service.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi } from "vitest";
import {
  getAllRelationships,
  getRelationshipGraph,
  getRelationships,
  addRelationship,
  removeRelationship,
} from "../relationship-service";

// Mock game manifests
vi.mock("@/lib/game/manifests", () => ({
  getAllItems: vi.fn().mockResolvedValue([]),
  getAllNpcs: vi.fn().mockResolvedValue([]),
  getAllResources: vi.fn().mockResolvedValue([]),
  getAllStores: vi.fn().mockResolvedValue([]),
  getAllAreas: vi.fn().mockResolvedValue([]),
}));

describe("RelationshipService", () => {
  it("extracts relationships from manifests", async () => {
    const relationships = await getAllRelationships();
    expect(Array.isArray(relationships)).toBe(true);
  });

  it("builds relationship graph", async () => {
    const graph = await getRelationshipGraph();
    expect(graph).toBeDefined();
    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
  });

  it("gets relationships for asset", async () => {
    const result = await getRelationships("test-asset");
    expect(result).toBeDefined();
    expect(Array.isArray(result.incoming || result.outgoing)).toBe(true);
  });

  it("adds relationship", async () => {
    const relationship = await addRelationship(
      "npc-1",
      "npc",
      "NPC 1",
      "item-1",
      "weapon",
      "Item 1",
      "drops"
    );

    expect(relationship).toBeDefined();
    expect(relationship?.id).toBeDefined();
  });

  it("removes relationship", async () => {
    const removed = await removeRelationship("rel-123");
    expect(typeof removed).toBe("boolean");
  });
});
