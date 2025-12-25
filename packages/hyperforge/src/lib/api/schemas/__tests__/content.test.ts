/**
 * Content Schemas Tests
 *
 * Tests for content API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  QuestGenerationSchema,
  AreaGenerationSchema,
  ItemGenerationSchema,
  StoreGenerationSchema,
  DialogueGenerationSchema,
} from "../content";

describe("ContentSchemas", () => {
  it("validates quest generation", () => {
    const result = QuestGenerationSchema.safeParse({
      type: "quest",
      name: "Test Quest",
      category: "side",
      difficulty: "medium",
    });
    expect(result.success).toBe(true);
  });

  it("validates area generation", () => {
    const result = AreaGenerationSchema.safeParse({
      type: "area",
      name: "Test Area",
      biome: "forest",
      size: "medium",
    });
    expect(result.success).toBe(true);
  });

  it("validates item generation", () => {
    const result = ItemGenerationSchema.safeParse({
      type: "item",
      name: "Test Item",
      itemType: "weapon",
      rarity: "common",
    });
    expect(result.success).toBe(true);
  });

  it("validates store generation", () => {
    const result = StoreGenerationSchema.safeParse({
      type: "store",
      name: "Test Store",
      storeType: "general",
    });
    expect(result.success).toBe(true);
  });

  it("validates dialogue generation", () => {
    const result = DialogueGenerationSchema.safeParse({
      npcId: "test-npc",
      context: {
        questId: "quest-1",
      },
    });
    expect(result.success).toBe(true);
  });
});
