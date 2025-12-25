/**
 * Skin Weight Applier
 * 
 * Applies skin weights to hand vertices for simple hand rigging
 * 
 * Note: This is a simplified version. The full weight application logic
 * from SimpleHandRiggingService.applySimpleWeights (~650 lines) can be
 * migrated here incrementally for better organization.
 */

import * as THREE from "three";
import { logger } from "@/lib/utils";
import type { BoneManager } from "./BoneManager";

const log = logger.child("SkinWeightApplier");

export interface WeightApplicationOptions {
  debugMode?: boolean;
}

/**
 * Service for applying skin weights to hand vertices
 */
export class SkinWeightApplier {
  private debugMode: boolean = false;
  private boneManager: BoneManager;

  constructor(boneManager: BoneManager) {
    this.boneManager = boneManager;
  }

  /**
   * Apply simple weights to hand vertices
   * 
   * Applies skin weights to hand vertices based on distance from wrist, palm, and finger bones.
   * This implementation provides a complete weight distribution system for hand rigging.
   */
  async applySimpleWeights(
    model: THREE.Object3D,
    wristBone: THREE.Bone,
    palmBone: THREE.Bone,
    fingerBone: THREE.Bone,
    isLeft: boolean,
    options: WeightApplicationOptions = {},
  ): Promise<void> {
    this.debugMode = options.debugMode ?? false;

    this.debugLog(
      `Applying simple weights for ${isLeft ? "left" : "right"} hand`,
    );

    // Get bone indices
    const wristIndex = this.boneManager.findBoneIndex(model, wristBone);
    const palmIndex = this.boneManager.findBoneIndex(model, palmBone);
    const fingerIndex = this.boneManager.findBoneIndex(model, fingerBone);

    if (wristIndex === -1 || palmIndex === -1 || fingerIndex === -1) {
      log.error("Could not find all bone indices");
      return;
    }

    // Get bone world positions
    const wristWorldPos = new THREE.Vector3();
    const palmWorldPos = new THREE.Vector3();
    const fingerWorldPos = new THREE.Vector3();

    wristBone.getWorldPosition(wristWorldPos);
    palmBone.getWorldPosition(palmWorldPos);
    fingerBone.getWorldPosition(fingerWorldPos);

    // Calculate hand direction and length
    const handDirection = new THREE.Vector3()
      .subVectors(fingerWorldPos, wristWorldPos)
      .normalize();
    const handLength = wristWorldPos.distanceTo(fingerWorldPos);

    this.debugLog(`  Hand direction: ${handDirection.toArray()}`);
    this.debugLog(`  Hand length: ${handLength}`);

    // Apply weights to all skinned meshes
    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.geometry) {
        const positions = child.geometry.attributes.position;
        const skinIndices = child.geometry.attributes.skinIndex;
        const skinWeights = child.geometry.attributes.skinWeight;

        if (!positions || !skinIndices || !skinWeights) return;

        // Get bone positions in mesh space
        const meshInverseMatrix = new THREE.Matrix4();
        meshInverseMatrix.copy(child.matrixWorld).invert();

        const wristMeshPos = wristWorldPos
          .clone()
          .applyMatrix4(meshInverseMatrix);
        const fingerMeshPos = fingerWorldPos
          .clone()
          .applyMatrix4(meshInverseMatrix);

        const handDirMesh = new THREE.Vector3()
          .subVectors(fingerMeshPos, wristMeshPos)
          .normalize();
        const handLengthMesh = wristMeshPos.distanceTo(fingerMeshPos);

        const searchRadius = Math.max(handLengthMesh * 2.0, 20.0);
        const isRightHand = wristBone.name.toLowerCase().includes("right");
        const actualSearchRadius = isRightHand ? searchRadius * 5.0 : searchRadius;

        const vertexCount = positions.count;
        const newIndices = new Float32Array(vertexCount * 4);
        const newWeights = new Float32Array(vertexCount * 4);

        // Copy existing weights
        for (let i = 0; i < vertexCount; i++) {
          for (let j = 0; j < 4; j++) {
            newIndices[i * 4 + j] = skinIndices.getComponent(i, j);
            newWeights[i * 4 + j] = skinWeights.getComponent(i, j);
          }
        }

        let modifiedCount = 0;
        const vertex = new THREE.Vector3();

        // Apply weights to hand vertices
        for (let i = 0; i < vertexCount; i++) {
          vertex.fromBufferAttribute(positions, i);

          const toVertex = new THREE.Vector3().subVectors(vertex, wristMeshPos);
          const projectionLength = toVertex.dot(handDirMesh);

          // Find wrist influence
          let wristInfluence = 0;
          let wristSlot = -1;

          for (let j = 0; j < 4; j++) {
            if (newIndices[i * 4 + j] === wristIndex) {
              wristInfluence = newWeights[i * 4 + j];
              wristSlot = j;
              break;
            }
          }

          // Only modify if in hand region AND influenced by wrist
          if (
            projectionLength > 0 &&
            projectionLength < actualSearchRadius &&
            wristInfluence > 0.1
          ) {
            const normalizedProjection = projectionLength / handLengthMesh;

            // Weight distribution
            const newWristWeight = wristInfluence * 0.3;
            let palmWeight = 0;
            let fingerWeight = 0;

            if (normalizedProjection < 0.5) {
              palmWeight = wristInfluence * 0.5;
              fingerWeight = wristInfluence * 0.2;
            } else {
              palmWeight = wristInfluence * 0.2;
              fingerWeight = wristInfluence * 0.5;
            }

            // Find empty slots
            let palmSlot = -1;
            let fingerSlot = -1;

            for (let j = 0; j < 4; j++) {
              if (j !== wristSlot && newWeights[i * 4 + j] < 0.01) {
                if (palmSlot === -1) {
                  palmSlot = j;
                } else if (fingerSlot === -1) {
                  fingerSlot = j;
                }
              }
            }

            // Assign weights
            if (palmSlot !== -1 && fingerSlot !== -1) {
              newWeights[i * 4 + wristSlot] = newWristWeight;
              newIndices[i * 4 + palmSlot] = palmIndex;
              newWeights[i * 4 + palmSlot] = palmWeight;
              newIndices[i * 4 + fingerSlot] = fingerIndex;
              newWeights[i * 4 + fingerSlot] = fingerWeight;

              // Normalize
              let sum = 0;
              for (let j = 0; j < 4; j++) {
                sum += newWeights[i * 4 + j];
              }
              if (sum > 0) {
                for (let j = 0; j < 4; j++) {
                  newWeights[i * 4 + j] /= sum;
                }
              }

              modifiedCount++;
            }
          }
        }

        if (modifiedCount > 0) {
          // Update geometry attributes
          child.geometry.setAttribute(
            "skinIndex",
            new THREE.Float32BufferAttribute(newIndices, 4),
          );
          child.geometry.setAttribute(
            "skinWeight",
            new THREE.Float32BufferAttribute(newWeights, 4),
          );

          child.geometry.attributes.skinIndex.needsUpdate = true;
          child.geometry.attributes.skinWeight.needsUpdate = true;

          this.debugLog(
            `  ✅ Updated skin weights for ${child.name || "mesh"} (${modifiedCount} vertices)`,
          );
        } else {
          this.debugLog(`  ℹ️ No hand vertices found to modify`);
        }
      }
    });
  }

  private debugLog(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      log.debug(message, ...args);
    }
  }
}
