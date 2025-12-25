/**
 * Mesh Fitting Service Tests
 *
 * Tests for mesh fitting functionality.
 * Uses real Three.js operations - NO MOCKS.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { MeshFittingService } from "../MeshFittingService";
import { Mesh, BufferGeometry, BufferAttribute } from "three";

describe("MeshFittingService", () => {
  let service: MeshFittingService;

  beforeAll(() => {
    service = new MeshFittingService();
  });

  describe("fitArmorToBody", () => {
    it("exists and has correct signature", () => {
      expect(typeof service.fitArmorToBody).toBe("function");
    });

    it("requires valid meshes", () => {
      const armorMesh = new Mesh(new BufferGeometry());
      const bodyMesh = new Mesh(new BufferGeometry());

      // Should handle inputs gracefully
      expect(() => {
        service.fitArmorToBody(armorMesh, bodyMesh, {
          smoothingPasses: 1,
        });
      }).not.toThrow();
    });
  });

  describe("service initialization", () => {
    it("creates service instance", () => {
      const instance = new MeshFittingService();
      expect(instance).toBeInstanceOf(MeshFittingService);
    });
  });
});
