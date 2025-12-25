/**
 * Model Scale Fixer
 * 
 * Handles fixing scale issues in 3D models, particularly for VRM conversion
 */

import * as THREE from "three";
import { logger } from "@/lib/utils";

const log = logger.child("ModelScaleFixer");

export interface ScaleFixOptions {
  debugMode?: boolean;
}

/**
 * Service for fixing model scale issues
 */
export class ModelScaleFixer {
  private debugMode: boolean = false;

  /**
   * Fix model scale issues
   * - Resets Armature scale to 1.0
   * - Scales geometry to match bone scale
   * - Resets bone scales to 1.0
   */
  fixModelScale(
    model: THREE.Object3D,
    options: ScaleFixOptions = {},
  ): void {
    this.debugMode = options.debugMode ?? false;

    this.debugLog("📊 Fixing model scale...");

    const BONE_SCALE_FIX = 100; // Bones are 0.01 scale, so we need 100x

    // CRITICAL: First find and reset Armature scale to 1.0
    // This prevents VRM converter from double-scaling
    let armatureFound = false;
    model.traverse((child) => {
      if (child.name === "Armature" && !armatureFound) {
        const oldScale = child.scale.x;
        if (Math.abs(oldScale - 1.0) > 0.001) {
          this.debugLog(
            `  Found Armature with scale ${oldScale.toFixed(4)}, resetting to 1.0`,
          );
          child.scale.set(1, 1, 1);
          armatureFound = true;
        }
      }
    });

    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        this.debugLog(`  Found SkinnedMesh: ${child.name}`);

        // Scale the geometry to match bone scale
        child.geometry.scale(BONE_SCALE_FIX, BONE_SCALE_FIX, BONE_SCALE_FIX);

        // Scale all bone positions to compensate
        if (child.skeleton) {
          child.skeleton.bones.forEach((bone) => {
            bone.position.multiplyScalar(BONE_SCALE_FIX);
            // IMPORTANT: Also reset bone scales to 1.0!
            bone.scale.set(1, 1, 1);
          });

          // Force update all bone matrices
          child.skeleton.bones.forEach((bone) => {
            bone.updateMatrixWorld(true);
          });

          // Recalculate inverse matrices
          child.skeleton.calculateInverses();

          // Update bind matrices
          child.updateMatrixWorld(true);
          child.bindMatrix.copy(child.matrixWorld);
          child.bindMatrixInverse.copy(child.matrixWorld).invert();
        }

        this.debugLog(
          `  ✅ Applied scale fix of ${BONE_SCALE_FIX}x to geometry and bones`,
        );
      }
    });

    // Update the entire model hierarchy after scale fixes
    model.updateMatrixWorld(true);

    // Final size check
    const finalBounds = new THREE.Box3().setFromObject(model);
    const finalSize = new THREE.Vector3();
    finalBounds.getSize(finalSize);
    this.debugLog(
      `📏 Final model size after fixes: ${finalSize.x.toFixed(3)} x ${finalSize.y.toFixed(3)} x ${finalSize.z.toFixed(3)}`,
    );
  }

  private debugLog(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      log.debug(message, ...args);
    }
  }
}
