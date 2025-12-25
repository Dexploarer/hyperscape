/**
 * Path Utilities Tests
 *
 * Tests for path utility functions.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  getAssetsBaseDir,
  getAssetDir,
  getImagesDir,
  getAudioDir,
  getUploadsDir,
  getContentDir,
  getServerManifestsDir,
  getServerModelsDir,
  getServerAvatarsDir,
  getServerEmotesDir,
  getPublicDataDir,
} from "../paths";

describe("Paths", () => {
  it("gets assets base directory", () => {
    const dir = getAssetsBaseDir();
    expect(typeof dir).toBe("string");
    expect(dir.length).toBeGreaterThan(0);
  });

  it("gets asset directory", () => {
    const dir = getAssetDir("test-asset");
    expect(dir).toContain("test-asset");
  });

  it("gets images directory", () => {
    const dir = getImagesDir();
    expect(dir).toContain("images");
  });

  it("gets audio directory", () => {
    const dir = getAudioDir();
    expect(dir).toContain("audio");
  });

  it("gets uploads directory", () => {
    const dir = getUploadsDir();
    expect(dir).toContain("uploads");
  });

  it("gets content directory", () => {
    const dir = getContentDir();
    expect(dir).toContain("content");
  });

  it("gets server manifests directory", () => {
    const dir = getServerManifestsDir();
    expect(typeof dir).toBe("string");
    expect(dir.length).toBeGreaterThan(0);
  });

  it("gets server models directory", () => {
    const dir = getServerModelsDir();
    expect(typeof dir).toBe("string");
    expect(dir.length).toBeGreaterThan(0);
  });

  it("gets server avatars directory", () => {
    const dir = getServerAvatarsDir();
    expect(typeof dir).toBe("string");
    expect(dir.length).toBeGreaterThan(0);
  });

  it("gets server emotes directory", () => {
    const dir = getServerEmotesDir();
    expect(typeof dir).toBe("string");
    expect(dir.length).toBeGreaterThan(0);
  });

  it("gets public data directory", () => {
    const dir = getPublicDataDir();
    expect(dir).toContain("public");
    expect(dir).toContain("data");
  });
});
