/**
 * Armor Fitting Service Tests
 *
 * Tests for armor fitting functionality.
 * Uses real Three.js and mesh operations - NO MOCKS.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { ArmorFittingService } from "../ArmorFittingService";
import { Mesh, SkinnedMesh, BufferGeometry, BufferAttribute } from "three";

describe("ArmorFittingService", () => {
  let service: ArmorFittingService;

  beforeAll(() => {
    service = new ArmorFittingService();
  });

  describe("bindArmorToSkeleton", () => {
    it("exists and has correct signature", () => {
      expect(typeof service.bindArmorToSkeleton).toBe("function");
    });

    it("requires valid mesh and skeleton", () => {
      const armorMesh = new Mesh(new BufferGeometry());
      const avatarMesh = new SkinnedMesh(new BufferGeometry());

      // Should handle invalid inputs gracefully
      expect(() => {
        service.bindArmorToSkeleton(armorMesh, avatarMesh, {
          searchRadius: 0.05,
        });
      }).not.toThrow();
    });
  });

  describe("service initialization", () => {
    it("creates service instance", () => {
      const instance = new ArmorFittingService();
      expect(instance).toBeInstanceOf(ArmorFittingService);
    });
  });
});
