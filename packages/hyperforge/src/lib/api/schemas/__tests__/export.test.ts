/**
 * Export Schemas Tests
 *
 * Tests for export API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  ManifestEntrySchema,
  ExportTargetTypeSchema,
  ExportRequestSchema,
  PromoteRequestSchema,
  ImportAssetsRequestSchema,
  ManifestImportRequestSchema,
  ManifestExportRequestSchema,
} from "../export";

describe("ExportSchemas", () => {
  it("validates manifest entry", () => {
    const result = ManifestEntrySchema.safeParse({
      id: "test-item",
      name: "Test Item",
      type: "weapon",
    });
    expect(result.success).toBe(true);
  });

  it("validates export target type", () => {
    const result = ExportTargetTypeSchema.safeParse("item");
    expect(result.success).toBe(true);
  });

  it("validates export request", () => {
    const result = ExportRequestSchema.safeParse({
      assetId: "test-asset",
      targetType: "item",
    });
    expect(result.success).toBe(true);
  });

  it("validates promote request", () => {
    const result = PromoteRequestSchema.safeParse({
      assetId: "test-asset",
      manifestEntry: {
        id: "test-item",
        name: "Test Item",
        type: "weapon",
      },
      targetManifest: "items",
    });
    expect(result.success).toBe(true);
  });

  it("validates import assets request", () => {
    const result = ImportAssetsRequestSchema.safeParse({
      assetIds: ["item-1", "item-2"],
    });
    expect(result.success).toBe(true);
  });

  it("validates manifest import request", () => {
    const result = ManifestImportRequestSchema.safeParse({
      direction: "from_game",
      manifestTypes: ["items"],
    });
    expect(result.success).toBe(true);
  });

  it("validates manifest export request", () => {
    const result = ManifestExportRequestSchema.safeParse({
      action: "preview",
      assetId: "test-asset",
      category: "weapon",
    });
    expect(result.success).toBe(true);
  });
});
