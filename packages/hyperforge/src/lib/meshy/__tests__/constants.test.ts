/**
 * Meshy Constants Tests
 *
 * Tests for Meshy API constants.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  MESHY_API_V1,
  MESHY_API_V2,
  MESHY_ENDPOINTS,
  POLYCOUNT_PRESETS,
  DEFAULT_GENERATION_CONFIG,
  DEFAULT_AI_MODEL,
  DEFAULT_TOPOLOGY,
  DEFAULT_TEXTURE_RESOLUTION,
  DEFAULT_CHARACTER_HEIGHT,
  THREE_JS_BEST_PRACTICES,
  getPolycountPreset,
  getRecommendedPolycount,
  createGenerationConfig,
  validatePolycount,
} from "../constants";

describe("MeshyConstants", () => {
  it("exports API URLs", () => {
    expect(MESHY_API_V1).toBeDefined();
    expect(MESHY_API_V2).toBeDefined();
    expect(typeof MESHY_API_V1).toBe("string");
    expect(typeof MESHY_API_V2).toBe("string");
  });

  it("exports endpoints", () => {
    expect(MESHY_ENDPOINTS).toBeDefined();
    expect(MESHY_ENDPOINTS.imageTo3d).toBeDefined();
    expect(MESHY_ENDPOINTS.textTo3d).toBeDefined();
  });

  it("exports polycount presets", () => {
    expect(POLYCOUNT_PRESETS).toBeDefined();
    expect(POLYCOUNT_PRESETS.small_prop).toBeDefined();
    expect(POLYCOUNT_PRESETS.npc_character).toBeDefined();
  });

  it("exports default config", () => {
    expect(DEFAULT_GENERATION_CONFIG).toBeDefined();
    expect(DEFAULT_GENERATION_CONFIG.assetClass).toBeDefined();
    expect(DEFAULT_GENERATION_CONFIG.targetPolycount).toBeDefined();
  });

  it("exports default values", () => {
    expect(DEFAULT_AI_MODEL).toBeDefined();
    expect(DEFAULT_TOPOLOGY).toBeDefined();
    expect(typeof DEFAULT_TEXTURE_RESOLUTION).toBe("number");
    expect(typeof DEFAULT_CHARACTER_HEIGHT).toBe("number");
  });

  it("exports Three.js best practices", () => {
    expect(THREE_JS_BEST_PRACTICES).toBeDefined();
    expect(THREE_JS_BEST_PRACTICES.maxTrianglesPerMesh).toBeDefined();
    expect(THREE_JS_BEST_PRACTICES.lodDistances).toBeDefined();
  });

  it("gets polycount preset", () => {
    const preset = getPolycountPreset("small_prop");
    expect(preset).toBeDefined();
    expect(preset.assetClass).toBe("small_prop");
  });

  it("gets recommended polycount", () => {
    const polycount = getRecommendedPolycount("medium_prop");
    expect(typeof polycount).toBe("number");
    expect(polycount).toBeGreaterThan(0);
  });

  it("creates generation config", () => {
    const config = createGenerationConfig("small_prop");
    expect(config).toBeDefined();
    expect(config.assetClass).toBe("small_prop");
    expect(config.targetPolycount).toBeDefined();
  });

  it("validates polycount", () => {
    const validation = validatePolycount("small_prop", 500);
    expect(validation.valid).toBe(true);
  });

  it("warns for low polycount", () => {
    const validation = validatePolycount("small_prop", 100);
    expect(validation.valid).toBe(true);
    expect(validation.warning).toBeDefined();
  });

  it("warns for high polycount", () => {
    const validation = validatePolycount("small_prop", 5000);
    expect(validation.valid).toBe(true);
    expect(validation.warning).toBeDefined();
  });
});
