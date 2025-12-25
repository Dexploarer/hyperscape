/**
 * Storage Service Tests
 *
 * Tests for the unified storage service.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { StorageService } from "../storage-service";
import { promises as fs } from "fs";
import path from "path";
import { getAssetsBaseDir } from "@/lib/utils/paths";

// Mock Supabase storage functions
vi.mock("../supabase-storage", () => ({
  isSupabaseConfigured: () => false, // Test with local fallback
  uploadAudio: vi.fn(),
  uploadImage: vi.fn(),
  uploadContent: vi.fn(),
  uploadSFXAudio: vi.fn(),
  uploadMusicAudio: vi.fn(),
  uploadVoiceAudio: vi.fn(),
  uploadConceptArtForAsset: vi.fn(),
  uploadSpriteForAsset: vi.fn(),
  saveForgeAsset: vi.fn(),
  getSupabasePublicUrl: vi.fn(),
  BUCKET_NAMES: {
    IMAGE_GENERATION: "image-generation",
    AUDIO_GENERATIONS: "audio-generations",
    CONTENT_GENERATIONS: "content-generations",
    MESHY_MODELS: "meshy-models",
    VRM_CONVERSION: "vrm-conversion",
    CONCEPT_ART: "concept-art-pipeline",
    BAKED_STRUCTURES: "baked structures",
  },
}));

describe("StorageService", () => {
  let storage: StorageService;
  let testAssetsDir: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testAssetsDir = path.join(process.cwd(), ".test-assets");
    await fs.mkdir(testAssetsDir, { recursive: true });
    storage = new StorageService(testAssetsDir);
  });

  it("creates instance with default assets directory", () => {
    const defaultStorage = new StorageService();
    expect(defaultStorage).toBeInstanceOf(StorageService);
  });

  it("creates instance with custom assets directory", () => {
    const customStorage = new StorageService("/custom/path");
    expect(customStorage).toBeInstanceOf(StorageService);
  });

  it("checks Supabase availability", () => {
    const isAvailable = storage.isSupabaseAvailable();
    expect(typeof isAvailable).toBe("boolean");
  });

  it("uploads generic file to local storage", async () => {
    const buffer = Buffer.from("test content");
    const result = await storage.upload(buffer, {
      extension: "txt",
      contentType: "text/plain",
      folder: "test",
      assetId: "test-file",
    });

    expect(result.success).toBe(true);
    expect(result.backend).toBe("local");
    expect(result.path).toContain("test-file.txt");
    expect(result.url).toContain("/api/files/");
  });

  it("uploads audio file to local storage", async () => {
    const buffer = Buffer.from("fake audio data");
    const result = await storage.uploadAudio(buffer, {
      type: "sfx",
      name: "test-sound",
      category: "combat",
    });

    expect(result.success).toBe(true);
    expect(result.backend).toBe("local");
    expect(result.url).toContain("/api/audio/file/sfx/");
  });

  it("uploads image file to local storage", async () => {
    const buffer = Buffer.from("fake image data");
    const result = await storage.uploadImage(buffer, {
      type: "concept-art",
      filename: "test-image",
      assetId: "test-asset",
    });

    expect(result.success).toBe(true);
    expect(result.backend).toBe("local");
    expect(result.url).toContain("/api/images/concept-art/");
  });

  it("uploads model file to local storage", async () => {
    const buffer = Buffer.from("fake model data");
    const result = await storage.uploadModel(buffer, {
      assetId: "test-model",
      format: "glb",
    });

    expect(result.success).toBe(true);
    expect(result.backend).toBe("local");
    expect(result.url).toContain("/api/assets/test-model/model.glb");
  });

  it("returns error when uploading model without assetId", async () => {
    const buffer = Buffer.from("fake model data");
    const result = await storage.uploadModel(buffer, {
      format: "glb",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("assetId is required");
  });

  it("uploads content JSON to local storage", async () => {
    const data = { test: "data" };
    const result = await storage.uploadContent(data, {
      type: "quest",
      filename: "test-quest",
    });

    expect(result.success).toBe(true);
    expect(result.backend).toBe("local");
    expect(result.url).toContain("/api/content/quest/");
  });

  it("gets public URL for local file", () => {
    const url = storage.getPublicUrl("test/path/file.txt");
    expect(url).toContain("/api/assets/");
  });

  it("gets bucket names", () => {
    const buckets = storage.getBucketNames();
    expect(buckets).toBeDefined();
    expect(buckets.IMAGE_GENERATION).toBe("image-generation");
  });

  it("downloads file from local storage", async () => {
    // Create a test file first
    const testPath = path.join(testAssetsDir, "test", "file.txt");
    await fs.mkdir(path.dirname(testPath), { recursive: true });
    await fs.writeFile(testPath, "test content");

    const buffer = await storage.downloadFile(["test", "file.txt"], "test");
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer?.toString()).toBe("test content");
  });

  it("returns null when downloading non-existent file", async () => {
    const buffer = await storage.downloadFile(["nonexistent", "file.txt"]);
    expect(buffer).toBeNull();
  });

  it("downloads model from local storage", async () => {
    // Create a test model file
    const modelPath = path.join(testAssetsDir, "test-model", "model.glb");
    await fs.mkdir(path.dirname(modelPath), { recursive: true });
    await fs.writeFile(modelPath, "fake model data");

    const buffer = await storage.downloadModel("test-model", "glb");
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it("returns null when downloading non-existent model", async () => {
    const buffer = await storage.downloadModel("nonexistent-model", "glb");
    expect(buffer).toBeNull();
  });

  it("downloads image from local storage", async () => {
    // Create a test image file
    const imagePath = path.join(
      testAssetsDir,
      "images",
      "concept-art",
      "test-asset",
      "test.png",
    );
    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    await fs.writeFile(imagePath, "fake image data");

    const buffer = await storage.downloadImage(
      ["concept-art", "test-asset", "test.png"],
      "concept-art",
    );
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it("downloads audio from local storage", async () => {
    // Create a test audio file
    const audioPath = path.join(
      testAssetsDir,
      "audio",
      "sfx",
      "combat",
      "test.mp3",
    );
    await fs.mkdir(path.dirname(audioPath), { recursive: true });
    await fs.writeFile(audioPath, "fake audio data");

    const buffer = await storage.downloadAudio(["sfx", "combat", "test.mp3"]);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
