/**
 * Game Schemas Tests
 *
 * Tests for game API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  StoreQuerySchema,
  GameDataTypeSchema,
  GameDataQuerySchema,
  GameManifestTypeSchema,
  StoreSchema,
  StoreItemSchema,
} from "../game";

describe("GameSchemas", () => {
  it("validates store query", () => {
    const result = StoreQuerySchema.safeParse({
      storeId: "test-store",
      itemId: "test-item",
    });
    expect(result.success).toBe(true);
  });

  it("validates game data type", () => {
    const result = GameDataTypeSchema.safeParse("item");
    expect(result.success).toBe(true);
  });

  it("validates game data query", () => {
    const result = GameDataQuerySchema.safeParse({
      type: "item",
      id: "test-item",
    });
    expect(result.success).toBe(true);
  });

  it("validates game manifest type", () => {
    const result = GameManifestTypeSchema.safeParse("items");
    expect(result.success).toBe(true);
  });

  it("validates store schema", () => {
    const result = StoreSchema.safeParse({
      id: "test-store",
      name: "Test Store",
      buyback: false,
      buybackRate: 0.5,
      items: [],
    });
    expect(result.success).toBe(true);
  });

  it("validates store item schema", () => {
    const result = StoreItemSchema.safeParse({
      id: "store-item-1",
      itemId: "test-item",
      name: "Test Item",
      price: 100,
      stockQuantity: 10,
      restockTime: 60,
    });
    expect(result.success).toBe(true);
  });
});
