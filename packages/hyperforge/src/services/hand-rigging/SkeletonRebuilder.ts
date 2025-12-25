/**
 * Skeleton Rebuilder
 * 
 * Handles rebuilding skeletons when new bones are added
 */

import * as THREE from "three";
import { logger } from "@/lib/utils";
import type { BoneManager } from "./BoneManager";

const log = logger.child("SkeletonRebuilder");

export interface SkeletonRebuildOptions {
  debugMode?: boolean;
}

/**
 * Service for rebuilding skeletons with new bones
 */
export class SkeletonRebuilder {
  private debugMode: boolean = false;
  private boneManager: BoneManager;

  constructor(boneManager: BoneManager) {
    this.boneManager = boneManager;
  }

  /**
   * Rebuild skeletons with new hand bones
   * Creates a shared skeleton that all meshes will use
   */
  rebuildSkeletonsWithNewBones(
    model: THREE.Object3D,
    newBones: THREE.Bone[],
    options: SkeletonRebuildOptions = {},
  ): THREE.Skeleton {
    this.debugMode = options.debugMode ?? false;

    const skeletonBones: THREE.Bone[] = [];
    const skeletonInverses: THREE.Matrix4[] = [];
    const processedBones = new Set<THREE.Bone>();

    // Collect all bones in the model
    const allBonesInModel: THREE.Bone[] = [];
    model.traverse((child) => {
      if (child instanceof THREE.Bone) {
        if (this.boneManager.isBoneInScene(child, model)) {
          allBonesInModel.push(child);
        } else {
          log.warn(
            `  ⚠️ Found orphaned bone during collection: ${child.name}`,
          );
        }
      }
    });
    this.debugLog(`  Found ${allBonesInModel.length} total bones in model`);

    // Get the original skeleton as reference for bone order
    let referenceSkeleton: THREE.Skeleton | undefined;
    const skinnedMeshes: THREE.SkinnedMesh[] = [];

    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        skinnedMeshes.push(child);
        if (!referenceSkeleton && child.skeleton) {
          referenceSkeleton = child.skeleton;
        }
      }
    });

    if (referenceSkeleton) {
      this.debugLog(
        `  Reference skeleton has ${referenceSkeleton.bones.length} bones`,
      );

      // Add all bones from the reference skeleton in order
      for (let i = 0; i < referenceSkeleton.bones.length; i++) {
        const bone = referenceSkeleton.bones[i];
        if (
          bone &&
          !processedBones.has(bone) &&
          this.boneManager.isBoneInScene(bone, model)
        ) {
          processedBones.add(bone);
          skeletonBones.push(bone);
          skeletonInverses.push(
            referenceSkeleton.boneInverses[i] || new THREE.Matrix4(),
          );
        } else if (bone && !this.boneManager.isBoneInScene(bone, model)) {
          log.warn(`  ⚠️ Skipping bone not in scene: ${bone.name}`);
        }
      }
    } else {
      log.warn("  No reference skeleton found!");
    }

    // Add new hand bones
    for (const bone of newBones) {
      if (!processedBones.has(bone)) {
        processedBones.add(bone);
        skeletonBones.push(bone);
        const inverse = new THREE.Matrix4();
        bone.updateWorldMatrix(true, false);
        inverse.copy(bone.matrixWorld).invert();
        skeletonInverses.push(inverse);
      }
    }

    // Add any bones that were in the model but not in the skeleton
    for (const bone of allBonesInModel) {
      if (
        !processedBones.has(bone) &&
        this.boneManager.isBoneInScene(bone, model)
      ) {
        log.warn(`  Adding bone not in original skeleton: ${bone.name}`);
        processedBones.add(bone);
        skeletonBones.push(bone);
        const inverse = new THREE.Matrix4();
        bone.updateWorldMatrix(true, false);
        inverse.copy(bone.matrixWorld).invert();
        skeletonInverses.push(inverse);
      }
    }

    this.debugLog(`  Total bones for new skeleton: ${skeletonBones.length}`);

    // Filter to valid bones only
    const validBones: THREE.Bone[] = [];
    const validInverses: THREE.Matrix4[] = [];

    for (let i = 0; i < skeletonBones.length; i++) {
      const bone = skeletonBones[i];
      if (bone && bone instanceof THREE.Bone && bone.isBone === true) {
        validBones.push(bone);
        validInverses.push(skeletonInverses[i]);
      } else {
        log.error(
          `  ❌ Found non-bone in skeleton at index ${i}: ${bone?.name || "undefined"}`,
        );
      }
    }

    this.debugLog(`  Filtered to ${validBones.length} valid bones`);

    // Sort bones by hierarchy depth
    const getBoneDepth = (bone: THREE.Bone): number => {
      let depth = 0;
      let current = bone.parent;
      while (current && current instanceof THREE.Bone) {
        depth++;
        current = current.parent;
      }
      return depth;
    };

    const sortedBones: THREE.Bone[] = [...validBones].sort(
      (a, b) => getBoneDepth(a) - getBoneDepth(b),
    );
    const sortedInverses: THREE.Matrix4[] = sortedBones.map((bone) => {
      const index = validBones.indexOf(bone);
      return validInverses[index];
    });

    // Verify bone hierarchy
    this.debugLog("  Verifying bone hierarchy...");
    for (let i = 0; i < sortedBones.length; i++) {
      const bone = sortedBones[i];
      if (bone.parent && bone.parent instanceof THREE.Bone) {
        const parentIndex = sortedBones.indexOf(bone.parent);
        if (parentIndex === -1) {
          log.error(
            `  ❌ Bone ${bone.name} has parent ${bone.parent.name} not in skeleton!`,
          );
        } else if (parentIndex >= i) {
          log.error(
            `  ❌ Bone ${bone.name} (${i}) has parent ${bone.parent.name} (${parentIndex}) that comes after it!`,
          );
        }
      }
    }

    // Create the shared skeleton
    const sharedSkeleton = new THREE.Skeleton(sortedBones, sortedInverses);
    this.debugLog(
      `  Created shared skeleton with ${sortedBones.length} bones`,
    );
    this.debugLog(
      `  Bone names: ${sortedBones.map((b) => b.name).join(", ")}`,
    );

    // Bind all skinned meshes to the shared skeleton
    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        const oldSkeleton = child.skeleton;

        // Create mapping from old bone indices to new bone indices
        const boneIndexMap = new Map<number, number>();
        if (oldSkeleton) {
          oldSkeleton.bones.forEach((oldBone, oldIndex) => {
            if (oldBone) {
              const newIndex = sortedBones.indexOf(oldBone);
              if (newIndex !== -1) {
                boneIndexMap.set(oldIndex, newIndex);
              } else {
                log.warn(`  Bone ${oldBone.name} not found in new skeleton!`);
              }
            }
          });
        }

        // Update skin indices if needed
        if (
          child.geometry &&
          child.geometry.attributes.skinIndex &&
          boneIndexMap.size > 0
        ) {
          const skinIndices = child.geometry.attributes.skinIndex;
          const skinWeights = child.geometry.attributes.skinWeight;

          for (let i = 0; i < skinIndices.count; i++) {
            for (let j = 0; j < 4; j++) {
              const oldBoneIndex = skinIndices.getComponent(i, j);
              const newBoneIndex = boneIndexMap.get(oldBoneIndex);

              if (newBoneIndex !== undefined) {
                skinIndices.setComponent(i, j, newBoneIndex);
              } else if (skinWeights.getComponent(i, j) > 0) {
                log.warn(
                  `  Vertex ${i} has weight to non-existent bone ${oldBoneIndex}`,
                );
                skinIndices.setComponent(i, j, 0);
                skinWeights.setComponent(i, j, 0);
              }
            }
          }

          skinIndices.needsUpdate = true;
          skinWeights.needsUpdate = true;
        }

        // Dispose old skeleton if different
        if (oldSkeleton && oldSkeleton !== sharedSkeleton) {
          if (oldSkeleton.boneTexture) {
            oldSkeleton.boneTexture.dispose();
          }
        }

        // Bind to shared skeleton
        child.bind(sharedSkeleton, child.bindMatrix || new THREE.Matrix4());

        // Force update
        child.skeleton.calculateInverses();
        child.skeleton.pose();
        child.skeleton.update();

        this.debugLog(
          `  Bound ${child.name || "mesh"} to shared skeleton (mapped ${boneIndexMap.size} bones)`,
        );
      }
    });

    return sharedSkeleton;
  }

  private debugLog(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      log.debug(message, ...args);
    }
  }
}
