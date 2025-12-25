/**
 * Bone Manager
 * 
 * Handles bone finding, validation, and skeleton management
 */

import * as THREE from "three";
import { logger } from "@/lib/utils";

const log = logger.child("BoneManager");

export interface BoneManagerOptions {
  debugMode?: boolean;
}

/**
 * Service for managing bones and skeletons
 */
export class BoneManager {
  private debugMode: boolean = false;

  /**
   * Find wrist bones in the model
   */
  findWristBones(
    model: THREE.Object3D,
    options: BoneManagerOptions = {},
  ): THREE.Bone[] {
    this.debugMode = options.debugMode ?? false;

    const wristBones: THREE.Bone[] = [];
    const allBoneNames: string[] = [];

    model.traverse((child) => {
      if (child instanceof THREE.Bone) {
        allBoneNames.push(child.name);
        const lowerName = child.name.toLowerCase();
        // Match hand/wrist bones with various naming conventions
        if (
          lowerName.includes("hand") ||
          lowerName.includes("wrist") ||
          lowerName.includes("forearm") // Some rigs end forearm at wrist
        ) {
          // Only include actual hand bones (not forearm unless it's the wrist)
          if (lowerName.includes("hand") || lowerName.includes("wrist")) {
            wristBones.push(child);
          }
        }
      }
    });

    // Debug: log all bone names found
    this.debugLog(
      `🦴 All bones in model (${allBoneNames.length}):`,
      allBoneNames.slice(0, 30).join(", ") +
        (allBoneNames.length > 30 ? "..." : ""),
    );
    this.debugLog(
      `🖐️ Potential wrist bones found: ${wristBones.map((b) => b.name).join(", ") || "none"}`,
    );

    return wristBones;
  }

  /**
   * Find bone index in skeleton
   */
  findBoneIndex(model: THREE.Object3D, bone: THREE.Bone): number {
    let index = -1;

    model.traverse((child) => {
      if (
        child instanceof THREE.SkinnedMesh &&
        child.skeleton &&
        index === -1
      ) {
        const foundIndex = child.skeleton.bones.indexOf(bone);
        if (foundIndex !== -1) {
          index = foundIndex;
        }
      }
    });

    return index;
  }

  /**
   * Count total bones in model
   */
  countBones(model: THREE.Object3D): number {
    let count = 0;
    model.traverse((child) => {
      if (child instanceof THREE.Bone) {
        count++;
      }
    });
    return count;
  }

  /**
   * Check if a bone is actually in the scene
   */
  isBoneInScene(bone: THREE.Bone, model: THREE.Object3D): boolean {
    // Check if the bone has a valid parent chain up to the model root
    let current: THREE.Object3D | null = bone;
    while (current) {
      if (current === model) {
        return true; // Found valid parent chain to model
      }
      // Also check if we've reached a Group or Object3D that's a child of the model
      // This handles cases where bones are under an armature/root object
      if (current.parent === model) {
        return true;
      }
      current = current.parent;
    }
    return false; // No valid parent chain to model
  }

  /**
   * Force skeleton update on all skinned meshes
   */
  updateAllSkeletons(model: THREE.Object3D): void {
    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        // Force recalculation of bone matrices
        child.skeleton.bones.forEach((bone) => {
          bone.updateMatrixWorld(true);
        });

        // Update skeleton
        child.skeleton.update();

        // Force geometry update
        if (child.geometry.attributes.position) {
          child.geometry.attributes.position.needsUpdate = true;
        }
        if (child.geometry.attributes.normal) {
          child.geometry.attributes.normal.needsUpdate = true;
        }

        // Recompute bounding sphere
        child.geometry.computeBoundingSphere();
        child.geometry.computeBoundingBox();

        this.debugLog(`  Updated skeleton for ${child.name || "mesh"}`);
      }
    });
  }

  /**
   * Remove orphaned bones from the model
   */
  removeOrphanedBones(
    model: THREE.Object3D,
    problematicBoneNames: string[] = [],
    options: BoneManagerOptions = {},
  ): void {
    this.debugMode = options.debugMode ?? false;

    this.debugLog("🧹 Removing orphaned bones before hand rigging...");

    const bonesToDelete: THREE.Bone[] = [];

    // Find all orphaned bones (bones not in any skeleton)
    const bonesInSkeletons = new Set<THREE.Bone>();
    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        child.skeleton.bones.forEach((bone) => bonesInSkeletons.add(bone));
      }
    });

    // Collect bones to delete - only remove bones that are in the problematic list
    model.traverse((node) => {
      if (node instanceof THREE.Bone) {
        if (problematicBoneNames.includes(node.name)) {
          bonesToDelete.push(node);
        }
      }
    });

    // Remove the bones from the scene hierarchy
    if (bonesToDelete.length > 0) {
      this.debugLog(
        `  Found ${bonesToDelete.length} orphaned/problematic bones to remove:`,
      );
      bonesToDelete.forEach((bone) => {
        this.debugLog(`    - ${bone.name}`);

        // Re-parent any children to the bone's parent
        const children = [...bone.children];
        children.forEach((child) => {
          if (bone.parent) {
            bone.parent.add(child);
            // Preserve world transform
            child.applyMatrix4(bone.matrix);
          }
        });

        // Remove the bone from its parent
        if (bone.parent) {
          bone.parent.remove(bone);
        }

        // CRITICAL: Clear all references to prevent orphaned nodes
        bone.parent = null;
        bone.children = [];
        bone.visible = false;
      });

      // CRITICAL: Also remove these bones from any skeleton's bone array
      model.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh && child.skeleton) {
          const skeleton = child.skeleton;
          const bonesArray = skeleton.bones;
          const inversesArray = skeleton.boneInverses;

          // Check if any bones to delete are in this skeleton
          const indicesToRemove: number[] = [];
          bonesToDelete.forEach((boneToDelete) => {
            const index = bonesArray.indexOf(boneToDelete);
            if (index !== -1) {
              indicesToRemove.push(index);
              this.debugLog(
                `    Removing ${boneToDelete.name} from skeleton at index ${index}`,
              );
            }
          });

          // Remove bones from skeleton arrays if found
          if (indicesToRemove.length > 0) {
            // Create mapping from old indices to new indices
            const indexMap = new Map<number, number>();
            let newIndex = 0;
            for (let oldIndex = 0; oldIndex < bonesArray.length; oldIndex++) {
              if (!indicesToRemove.includes(oldIndex)) {
                indexMap.set(oldIndex, newIndex);
                newIndex++;
              }
            }

            // Update skin indices to use new bone indices
            if (child.geometry && child.geometry.attributes.skinIndex) {
              const skinIndices = child.geometry.attributes.skinIndex;
              for (let i = 0; i < skinIndices.count; i++) {
                for (let j = 0; j < 4; j++) {
                  const oldIdx = skinIndices.getComponent(i, j);
                  const newIdx = indexMap.get(oldIdx);
                  if (newIdx !== undefined) {
                    skinIndices.setComponent(i, j, newIdx);
                  } else if (indicesToRemove.includes(oldIdx)) {
                    // This vertex was weighted to a removed bone, zero it out
                    skinIndices.setComponent(i, j, 0);
                    child.geometry.attributes.skinWeight.setComponent(
                      i,
                      j,
                      0,
                    );
                  }
                }
              }
              skinIndices.needsUpdate = true;
              child.geometry.attributes.skinWeight.needsUpdate = true;
            }

            // Now remove the bones from arrays
            // Sort indices in descending order to remove from end first
            indicesToRemove.sort((a, b) => b - a);
            indicesToRemove.forEach((idx) => {
              bonesArray.splice(idx, 1);
              inversesArray.splice(idx, 1);
            });
            this.debugLog(
              `    Updated skeleton: now has ${skeleton.bones.length} bones`,
            );
          }
        }
      });

      // Update world matrices after removal
      model.updateMatrixWorld(true);
      this.debugLog("  ✅ Orphaned bones removed");
    }
  }

  private debugLog(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      log.debug(message, ...args);
    }
  }
}
