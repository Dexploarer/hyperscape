/**
 * Model Exporter
 * 
 * Handles exporting 3D models to GLB format with validation
 */

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { logger } from "@/lib/utils";
import type { BoneManager } from "./BoneManager";

const log = logger.child("ModelExporter");

export interface ExportOptions {
  debugMode?: boolean;
}

/**
 * Service for exporting 3D models
 */
export class ModelExporter {
  private exporter: GLTFExporter;
  private debugMode: boolean = false;
  private boneManager: BoneManager;

  constructor(boneManager: BoneManager) {
    this.exporter = new GLTFExporter();
    this.boneManager = boneManager;
  }

  /**
   * Validate model structure before export
   */
  validateModelStructure(model: THREE.Object3D): {
    isValid: boolean;
    errors: string[];
  } {
    const issues: string[] = [];

    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        // Check for null bones
        child.skeleton.bones.forEach((bone, index) => {
          if (!bone) {
            issues.push(`Skeleton has null bone at index ${index}`);
          }
        });

        // Check bone count matches inverse count
        if (
          child.skeleton.bones.length !== child.skeleton.boneInverses.length
        ) {
          issues.push(
            `Bone count (${child.skeleton.bones.length}) doesn't match inverse count (${child.skeleton.boneInverses.length})`,
          );
        }

        // Check if all bones are in the scene graph
        child.skeleton.bones.forEach((bone, index) => {
          if (bone && !bone.parent) {
            issues.push(`Bone ${bone.name} at index ${index} has no parent`);
          }
        });
      }
    });

    if (issues.length > 0) {
      log.warn("Model validation issues:", issues);
      return { isValid: false, errors: issues };
    } else {
      this.debugLog("✅ Model structure validated successfully");
      return { isValid: true, errors: [] };
    }
  }

  /**
   * Export model to GLB
   * 
   * Note: Full export logic with skeleton validation is complex (~600 lines).
   * This is a simplified version that handles core export functionality.
   * The full validation logic from SimpleHandRiggingService.exportModel can be
   * migrated here incrementally.
   */
  async exportModel(
    model: THREE.Object3D,
    options: ExportOptions = {},
  ): Promise<ArrayBuffer> {
    this.debugMode = options.debugMode ?? false;

    this.debugLog("📦 Preparing model for export...");

    // Ensure all matrices are up to date before export
    model.updateMatrixWorld(true);

    // Update all skeletons
    this.boneManager.updateAllSkeletons(model);

    // Validate model structure
    const validationResult = this.validateModelStructure(model);
    if (!validationResult.isValid) {
      log.error("Model validation failed:", validationResult.errors);
    }

    // Export as GLB
    return new Promise((resolve, reject) => {
      this.exporter.parse(
        model,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error("Export failed: result is not ArrayBuffer"));
          }
        },
        (error) =>
          reject(error instanceof Error ? error : new Error(String(error))),
        {
          binary: true,
          animations: [], // No animations needed
          forceIndices: true, // Ensure indices are included
          includeCustomExtensions: false,
          embedImages: true, // Embed images if any
        },
      );
    });
  }

  private debugLog(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      log.debug(message, ...args);
    }
  }
}
