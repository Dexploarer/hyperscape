/**
 * Asset Naming Tests
 *
 * Tests for asset naming utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  toSnakeCase,
  toKebabCase,
  generateAssetId,
  generateAudioId,
  generateManifestId,
} from "../asset-naming";

describe("AssetNaming", () => {
  it("converts to snake_case", () => {
    expect(toSnakeCase("Bronze Sword")).toBe("bronze_sword");
    expect(toSnakeCase("Chain Body")).toBe("chain_body");
    expect(toSnakeCase("Spiked Helmet")).toBe("spiked_helmet");
  });

  it("converts to kebab-case", () => {
    expect(toKebabCase("Bronze Sword")).toBe("bronze-sword");
    expect(toKebabCase("Chain Body")).toBe("chain-body");
    expect(toKebabCase("Spiked Helmet")).toBe("spiked-helmet");
  });

  it("generates asset ID", () => {
    const id = generateAssetId("weapon", {
      category: "weapon",
      material: "bronze",
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates audio ID", () => {
    const id = generateAudioId("sword-clash", "sfx", {
      category: "combat",
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates manifest ID", () => {
    const id = generateManifestId("Bronze Sword", "item", {
      category: "weapon",
    });
    expect(typeof id).toBe("string");
    expect(/^[a-z0-9_]+$/.test(id)).toBe(true);
  });

});
