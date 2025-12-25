/**
 * Structure Service Tests
 *
 * Tests for structure service operations.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadStructures,
  saveStructures,
  getStructure,
  upsertStructure,
  deleteStructure,
  loadPieceLibrary,
  savePieceLibrary,
  addPiece,
  getPiece,
  deletePiece,
} from "../structure-service";
import type { StructureDefinition, BuildingPiece, PieceLibrary } from "@/types/structures";
import { promises as fs } from "fs";
import path from "path";
import { getPublicDataDir } from "@/lib/utils";

// Mock paths utility
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return {
    ...actual,
    getPublicDataDir: () => path.join(process.cwd(), ".test-data"),
  };
});

describe("StructureService", () => {
  const testDataDir = path.join(process.cwd(), ".test-data");
  const structuresFile = path.join(testDataDir, "structures.json");
  const piecesFile = path.join(testDataDir, "building-pieces.json");

  beforeEach(async () => {
    // Clean up test files
    try {
      await fs.unlink(structuresFile);
    } catch {
      // File doesn't exist
    }
    try {
      await fs.unlink(piecesFile);
    } catch {
      // File doesn't exist
    }
  });

  it("loads empty structures when file doesn't exist", async () => {
    const structures = await loadStructures();
    expect(Array.isArray(structures)).toBe(true);
    expect(structures.length).toBe(0);
  });

  it("saves and loads structures", async () => {
    const testStructures: StructureDefinition[] = [
      {
        id: "test-structure",
        name: "Test Structure",
        description: "A test structure",
        pieces: [],
        bounds: { width: 10, height: 5, depth: 10 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enterable: false,
      },
    ];

    await saveStructures(testStructures);
    const loaded = await loadStructures();

    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe("test-structure");
  });

  it("gets a structure by ID", async () => {
    const testStructures: StructureDefinition[] = [
      {
        id: "test-structure",
        name: "Test Structure",
        description: "A test structure",
        pieces: [],
        bounds: { width: 10, height: 5, depth: 10 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enterable: false,
      },
    ];

    await saveStructures(testStructures);
    const structure = await getStructure("test-structure");

    expect(structure).toBeDefined();
    expect(structure?.id).toBe("test-structure");
  });

  it("returns null for non-existent structure", async () => {
    const structure = await getStructure("nonexistent");
    expect(structure).toBeNull();
  });

  it("upserts a structure (creates new)", async () => {
    const structure: StructureDefinition = {
      id: "new-structure",
      name: "New Structure",
      description: "A new structure",
      pieces: [],
      bounds: { width: 10, height: 5, depth: 10 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enterable: false,
    };

    const result = await upsertStructure(structure);
    expect(result.id).toBe("new-structure");

    const loaded = await loadStructures();
    expect(loaded.length).toBe(1);
  });

  it("upserts a structure (updates existing)", async () => {
    const initial: StructureDefinition = {
      id: "test-structure",
      name: "Test Structure",
      description: "A test structure",
      pieces: [],
      bounds: { width: 10, height: 5, depth: 10 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enterable: false,
    };

    await saveStructures([initial]);

    const updated: StructureDefinition = {
      id: "test-structure",
      name: "Updated Structure",
      description: "An updated structure",
      pieces: [],
      bounds: { width: 10, height: 5, depth: 10 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enterable: false,
    };

    await upsertStructure(updated);
    const loaded = await loadStructures();

    expect(loaded.length).toBe(1);
    expect(loaded[0].name).toBe("Updated Structure");
  });

  it("deletes a structure", async () => {
    const testStructures: StructureDefinition[] = [
      {
        id: "test-structure",
        name: "Test Structure",
        description: "A test structure",
        pieces: [],
        bounds: { width: 10, height: 5, depth: 10 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enterable: false,
      },
    ];

    await saveStructures(testStructures);
    const deleted = await deleteStructure("test-structure");

    expect(deleted).toBe(true);

    const loaded = await loadStructures();
    expect(loaded.length).toBe(0);
  });

  it("returns false when deleting non-existent structure", async () => {
    const deleted = await deleteStructure("nonexistent");
    expect(deleted).toBe(false);
  });

  it("loads piece library with defaults when file doesn't exist", async () => {
    const library = await loadPieceLibrary();
    expect(library).toBeDefined();
    expect(Array.isArray(library.pieces)).toBe(true);
    expect(Array.isArray(library.categories)).toBe(true);
  });

  it("saves and loads piece library", async () => {
    const library: PieceLibrary = {
      pieces: [
        {
          id: "test-piece",
          name: "Test Piece",
          type: "wall",
          modelUrl: "/models/test.glb",
          thumbnailUrl: "/thumbnails/test.png",
          dimensions: { width: 1, height: 2, depth: 0.5 },
          snapPoints: [],
        },
      ],
      categories: [],
      lastUpdated: new Date().toISOString(),
    };

    await savePieceLibrary(library);
    const loaded = await loadPieceLibrary();

    expect(loaded.pieces.length).toBe(1);
    expect(loaded.pieces[0].id).toBe("test-piece");
  });

  it("adds a piece to library", async () => {
    const piece: BuildingPiece = {
      id: "new-piece",
      name: "New Piece",
      type: "wall",
      modelUrl: "/models/new.glb",
      thumbnailUrl: "/thumbnails/new.png",
      dimensions: { width: 1, height: 2, depth: 0.5 },
      snapPoints: [],
    };

    const result = await addPiece(piece);
    expect(result.id).toBe("new-piece");

    const library = await loadPieceLibrary();
    expect(library.pieces.some((p) => p.id === "new-piece")).toBe(true);
  });

  it("throws error when adding duplicate piece", async () => {
    const piece: BuildingPiece = {
      id: "duplicate-piece",
      name: "Duplicate Piece",
      type: "wall",
      modelUrl: "/models/dup.glb",
      thumbnailUrl: "/thumbnails/dup.png",
      dimensions: { width: 1, height: 2, depth: 0.5 },
      snapPoints: [],
    };

    await addPiece(piece);

    await expect(addPiece(piece)).rejects.toThrow();
  });

  it("gets a piece by ID", async () => {
    const piece: BuildingPiece = {
      id: "test-piece",
      name: "Test Piece",
      type: "wall",
      modelUrl: "/models/test.glb",
      thumbnailUrl: "/thumbnails/test.png",
      dimensions: { width: 1, height: 2, depth: 0.5 },
      snapPoints: [],
    };

    await addPiece(piece);
    const found = await getPiece("test-piece");

    expect(found).toBeDefined();
    expect(found?.id).toBe("test-piece");
  });

  it("returns null for non-existent piece", async () => {
    const piece = await getPiece("nonexistent");
    expect(piece).toBeNull();
  });

  it("deletes a piece from library", async () => {
    const piece: BuildingPiece = {
      id: "test-piece",
      name: "Test Piece",
      type: "wall",
      modelUrl: "/models/test.glb",
      thumbnailUrl: "/thumbnails/test.png",
      dimensions: { width: 1, height: 2, depth: 0.5 },
      snapPoints: [],
    };

    await addPiece(piece);
    const deleted = await deletePiece("test-piece");

    expect(deleted).toBe(true);

    const library = await loadPieceLibrary();
    expect(library.pieces.some((p) => p.id === "test-piece")).toBe(false);
  });

  it("returns false when deleting non-existent piece", async () => {
    const deleted = await deletePiece("nonexistent");
    expect(deleted).toBe(false);
  });
});
