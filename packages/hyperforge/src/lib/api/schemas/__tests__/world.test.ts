/**
 * World Schemas Tests
 *
 * Tests for world API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  WorldAreaSchema,
  WorldAreasConfigSchema,
  WorldEntitySchema,
  CreateEntitySchema,
  EntityPatchSchema,
  WorldConfigPostSchema,
} from "../world";

describe("WorldSchemas", () => {
  it("validates world area", () => {
    const result = WorldAreaSchema.safeParse({
      name: "Test Area",
      tiles: [],
    });
    expect(result.success).toBe(true);
  });

  it("validates world areas config", () => {
    const result = WorldAreasConfigSchema.safeParse({
      starterTowns: {
        "town-1": {
          name: "Starter Town",
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates world entity", () => {
    const result = WorldEntitySchema.safeParse({
      id: "test-entity",
      name: "Test Entity",
      type: "npc",
    });
    expect(result.success).toBe(true);
  });

  it("validates create entity", () => {
    const result = CreateEntitySchema.safeParse({
      id: "test-entity",
      name: "Test Entity",
      type: "npc",
      position: { x: 0, y: 0, z: 0 },
    });
    expect(result.success).toBe(true);
  });

  it("validates entity patch", () => {
    const result = EntityPatchSchema.safeParse({
      name: "Updated Entity",
      position: { x: 1, y: 2, z: 3 },
    });
    expect(result.success).toBe(true);
  });

  it("validates world config post", () => {
    const result = WorldConfigPostSchema.safeParse({
      action: "merge",
      config: {
        name: "Test World",
      },
    });
    expect(result.success).toBe(true);
  });
});
