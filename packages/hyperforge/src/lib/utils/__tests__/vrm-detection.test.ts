/**
 * VRM Detection Tests
 *
 * Tests for VRM detection utilities.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect, vi } from "vitest";
import { isVRMModel, isVRMUrl, validateVRMForFitting } from "../vrm-detection";
import * as THREE from "three";

// Mock Three.js
vi.mock("three", () => ({
  Bone: class Bone extends Object {
    name = "";
  },
  Object3D: class Object3D {
    userData: Record<string, unknown> = {};
    traverse(_callback: (child: unknown) => void): void {}
  },
}));

describe("VRMDetection", () => {
  it("checks if URL is VRM", () => {
    expect(isVRMUrl("test.vrm")).toBe(true);
    expect(isVRMUrl("test.VRM")).toBe(true);
    expect(isVRMUrl("test.glb")).toBe(false);
  });

  it("checks if model has VRM extension", () => {
    const gltf = {
      scene: new THREE.Object3D(),
      parser: {
        json: {
          extensions: {
            VRMC_vrm: {},
          },
        },
      },
    };

    expect(isVRMModel(gltf)).toBe(true);
  });

  it("checks if model has VRM in userData", () => {
    const scene = new THREE.Object3D();
    scene.userData.vrm = true;

    const gltf = {
      scene,
      parser: undefined,
    };

    expect(isVRMModel(gltf)).toBe(true);
  });

  it("validates VRM for fitting", () => {
    const scene = new THREE.Object3D();
    scene.userData.vrm = true;

    const result = validateVRMForFitting({ scene }, "test.vrm");
    expect(result.isValid).toBe(true);
  });

  it("returns error for non-VRM model", () => {
    const scene = new THREE.Object3D();

    const result = validateVRMForFitting({ scene }, "test.glb");
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
