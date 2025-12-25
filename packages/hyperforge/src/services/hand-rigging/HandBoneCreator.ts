/**
 * Hand Bone Creator
 * 
 * Creates simple hand bones (palm and finger bones) for rigging
 */

import * as THREE from "three";
import { logger } from "@/lib/utils";
import type { BoneManager } from "./BoneManager";
import type { SkeletonRebuilder } from "./SkeletonRebuilder";
import type { SkinWeightApplier } from "./SkinWeightApplier";

const log = logger.child("HandBoneCreator");

export interface HandBoneCreationOptions {
  palmBoneLength: number;
  fingerBoneLength: number;
  debugMode?: boolean;
}

/**
 * Service for creating hand bones
 */
export class HandBoneCreator {
  private debugMode: boolean = false;
  private boneManager: BoneManager;
  private skeletonRebuilder: SkeletonRebuilder;
  private weightApplier: SkinWeightApplier;

  constructor(
    boneManager: BoneManager,
    skeletonRebuilder: SkeletonRebuilder,
    weightApplier: SkinWeightApplier,
  ) {
    this.boneManager = boneManager;
    this.skeletonRebuilder = skeletonRebuilder;
    this.weightApplier = weightApplier;
  }

  /**
   * Create simple hand bones (palm and finger bones)
   */
  async createSimpleHandBones(
    model: THREE.Object3D,
    wristBone: THREE.Bone,
    options: HandBoneCreationOptions,
  ): Promise<THREE.Bone[] | null> {
    this.debugMode = options.debugMode ?? false;

    try {
      const isLeft = wristBone.name.toLowerCase().includes("left");
      const side = isLeft ? "left" : "right";

      this.debugLog(`\n🖐️ Creating simple hand bones for ${side} hand...`);

      // Get wrist world position and matrix
      const wristWorldPos = new THREE.Vector3();
      const wristWorldMatrix = new THREE.Matrix4();
      wristBone.getWorldPosition(wristWorldPos);
      wristBone.updateWorldMatrix(true, false);
      wristWorldMatrix.copy(wristBone.matrixWorld);

      this.debugLog(`  Wrist bone: ${wristBone.name}`);
      this.debugLog(`  Wrist world position: ${wristWorldPos.toArray()}`);
      this.debugLog(`  Wrist local position: ${wristBone.position.toArray()}`);

      // Auto-scale based on the forearm length
      const forearmLength = wristBone.position.length();
      this.debugLog(`  Forearm length: ${forearmLength}`);

      // Get parent bone's world scale to understand the transform
      const parentWorldScale = new THREE.Vector3();
      if (wristBone.parent && wristBone.parent instanceof THREE.Bone) {
        wristBone.parent.getWorldScale(parentWorldScale);
      } else {
        parentWorldScale.set(1, 1, 1);
      }

      this.debugLog(`  Parent bone world scale: ${parentWorldScale.x}`);

      // Calculate hand bone lengths based on forearm
      const handToForearmRatio = 0.65; // Hand is 65% of forearm length
      const totalHandLength = forearmLength * handToForearmRatio;

      // Palm is about 40% of hand, fingers 60%
      const finalPalmLength = totalHandLength * 0.4;
      const finalFingerLength = totalHandLength * 0.6;

      this.debugLog(`  Hand to forearm ratio: ${handToForearmRatio}`);
      this.debugLog(`  Total hand length: ${totalHandLength} (local space)`);
      this.debugLog(
        `  Bone lengths - Palm: ${finalPalmLength}, Finger: ${finalFingerLength}`,
      );

      // Get the forward direction (along the arm towards fingers)
      const forward = this.getHandForwardDirection(model, wristBone, isLeft);
      this.debugLog(`  Forward direction: ${forward.toArray()}`);

      const localPalmLength = finalPalmLength;
      const localFingerLength = finalFingerLength;

      this.debugLog(
        `  Using local space lengths - Palm: ${localPalmLength}, Finger: ${localFingerLength}`,
      );

      // Create palm bone (wrist to palm center)
      const palmBone = new THREE.Bone();
      palmBone.name = `${wristBone.name}_Palm`;

      // Position palm bone at end of wrist (in local space of wrist bone)
      const palmPosition = forward.clone().multiplyScalar(localPalmLength);
      palmBone.position.copy(palmPosition);

      // Create finger bone (palm center to fingertips)
      const fingerBone = new THREE.Bone();
      fingerBone.name = `${wristBone.name}_Fingers`;

      // Position finger bone at end of palm bone (in local space of palm bone)
      const fingerPosition = forward.clone().multiplyScalar(localFingerLength);
      fingerBone.position.copy(fingerPosition);

      this.debugLog(
        `  Palm bone local position: ${palmBone.position.toArray()}`,
      );
      this.debugLog(
        `  Finger bone local position: ${fingerBone.position.toArray()}`,
      );

      // IMPORTANT: Set up parent-child relationship BEFORE adding to skeleton
      palmBone.add(fingerBone);
      wristBone.add(palmBone);

      // Update matrices after hierarchy is established
      wristBone.updateMatrixWorld(true);
      palmBone.updateMatrixWorld(true);
      fingerBone.updateMatrixWorld(true);

      // Debug: Check world positions after adding to hierarchy
      const palmWorldPos = new THREE.Vector3();
      const fingerWorldPos = new THREE.Vector3();
      palmBone.getWorldPosition(palmWorldPos);
      fingerBone.getWorldPosition(fingerWorldPos);

      this.debugLog(`  Palm world position: ${palmWorldPos.toArray()}`);
      this.debugLog(`  Finger world position: ${fingerWorldPos.toArray()}`);
      this.debugLog(
        `  Distance wrist->palm: ${wristWorldPos.distanceTo(palmWorldPos)}`,
      );
      this.debugLog(
        `  Distance palm->finger: ${palmWorldPos.distanceTo(fingerWorldPos)}`,
      );

      // Verify bone hierarchy
      this.debugLog(`  Bone hierarchy:`);
      this.debugLog(`    ${wristBone.name} (existing wrist)`);
      this.debugLog(
        `      └─ ${palmBone.name} (new palm) - ${palmBone.children.length} children`,
      );
      this.debugLog(
        `           └─ ${fingerBone.name} (new finger) - ${fingerBone.children.length} children`,
      );

      // Rebuild skeletons with new bones
      this.skeletonRebuilder.rebuildSkeletonsWithNewBones(
        model,
        [palmBone, fingerBone],
        { debugMode: this.debugMode },
      );

      // Apply weights to hand vertices
      await this.weightApplier.applySimpleWeights(
        model,
        wristBone,
        palmBone,
        fingerBone,
        isLeft,
        { debugMode: this.debugMode },
      );

      this.debugLog(`✅ Created 2 simple bones for ${side} hand`);

      return [palmBone, fingerBone];
    } catch (error) {
      log.error(`Failed to create bones for ${wristBone.name}:`, error);
      return null;
    }
  }

  /**
   * Get the forward direction for the hand (from wrist towards fingers)
   */
  private getHandForwardDirection(
    model: THREE.Object3D,
    wristBone: THREE.Bone,
    _isLeft: boolean,
  ): THREE.Vector3 {
    this.debugLog(`    Detecting hand forward direction for ${wristBone.name}`);

    // Method 1: Try to find the direction from elbow/forearm to wrist
    const parentBone = wristBone.parent as THREE.Bone;
    if (parentBone && parentBone.isBone) {
      this.debugLog(`    Found parent bone: ${parentBone.name}`);

      // Get positions in world space
      const parentWorldPos = new THREE.Vector3();
      const wristWorldPos = new THREE.Vector3();
      parentBone.getWorldPosition(parentWorldPos);
      wristBone.getWorldPosition(wristWorldPos);

      // Direction from parent (forearm/elbow) to wrist
      const armDirection = new THREE.Vector3()
        .subVectors(wristWorldPos, parentWorldPos)
        .normalize();

      this.debugLog(`    Arm direction (world): ${armDirection.toArray()}`);

      // Convert to wrist's local space
      const wristWorldMatrix = new THREE.Matrix4();
      wristBone.updateWorldMatrix(true, false);
      wristWorldMatrix.copy(wristBone.matrixWorld);

      const wristWorldMatrixInverse = new THREE.Matrix4();
      wristWorldMatrixInverse.copy(wristWorldMatrix).invert();

      // Apply only the rotation part (not translation)
      const rotationOnly = new THREE.Matrix4();
      rotationOnly.extractRotation(wristWorldMatrixInverse);

      armDirection.applyMatrix4(rotationOnly);
      armDirection.normalize();

      this.debugLog(`    Arm direction (local): ${armDirection.toArray()}`);

      // The hand typically continues in the same direction as the arm
      return armDirection;
    }

    // Method 2: Try to find hand mesh vertices
    const handVertices = this.findHandVertices(model, wristBone);

    if (handVertices.length > 10) {
      // Calculate average position of hand vertices
      const avgPos = new THREE.Vector3();
      for (const vertex of handVertices) {
        avgPos.add(vertex);
      }
      avgPos.divideScalar(handVertices.length);

      // Get wrist world position
      const wristPos = new THREE.Vector3();
      wristBone.getWorldPosition(wristPos);

      // Direction from wrist to hand center
      const direction = avgPos.sub(wristPos).normalize();

      this.debugLog(`    Found ${handVertices.length} hand vertices`);
      this.debugLog(
        `    Hand center direction (world): ${direction.toArray()}`,
      );

      // Convert to local space of wrist bone
      const wristWorldMatrix = new THREE.Matrix4();
      wristBone.updateWorldMatrix(true, false);
      wristWorldMatrix.copy(wristBone.matrixWorld);

      const wristWorldMatrixInverse = new THREE.Matrix4();
      wristWorldMatrixInverse.copy(wristWorldMatrix).invert();

      // Apply only the rotation part
      const rotationOnly = new THREE.Matrix4();
      rotationOnly.extractRotation(wristWorldMatrixInverse);

      direction.applyMatrix4(rotationOnly);
      direction.normalize();

      this.debugLog(
        `    Hand center direction (local): ${direction.toArray()}`,
      );

      return direction;
    }

    // Method 3: Fallback based on common rig patterns
    this.debugLog("    Using fallback direction based on common rig patterns");

    // For most humanoid rigs, hands extend along Y axis
    let bestAxis = new THREE.Vector3(0, 1, 0);

    // Check if bone name gives us hints
    const boneName = wristBone.name.toLowerCase();
    if (boneName.includes("_l") || boneName.includes("left")) {
      bestAxis = new THREE.Vector3(0, 1, 0);
    } else if (boneName.includes("_r") || boneName.includes("right")) {
      bestAxis = new THREE.Vector3(0, 1, 0);
    }

    this.debugLog(`    Fallback direction: ${bestAxis.toArray()}`);

    return bestAxis;
  }

  /**
   * Find vertices that belong to the hand
   */
  private findHandVertices(
    model: THREE.Object3D,
    wristBone: THREE.Bone,
  ): THREE.Vector3[] {
    const handVertices: THREE.Vector3[] = [];
    const wristIndex = this.boneManager.findBoneIndex(model, wristBone);

    if (wristIndex === -1) {
      this.debugLog("    Could not find wrist bone index");
      return handVertices;
    }

    this.debugLog(
      `    Finding hand vertices for wrist bone index: ${wristIndex}`,
    );

    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.geometry) {
        const positions = child.geometry.attributes.position;
        const skinIndices = child.geometry.attributes.skinIndex;
        const skinWeights = child.geometry.attributes.skinWeight;

        if (!positions || !skinIndices || !skinWeights) return;

        const vertex = new THREE.Vector3();
        let foundCount = 0;

        for (let i = 0; i < positions.count; i++) {
          // Check if this vertex is influenced by the wrist
          for (let j = 0; j < 4; j++) {
            const boneIndex = skinIndices.getComponent(i, j);
            const weight = skinWeights.getComponent(i, j);

            if (boneIndex === wristIndex && weight > 0.1) {
              vertex.fromBufferAttribute(positions, i);
              // Transform to world space
              vertex.applyMatrix4(child.matrixWorld);
              handVertices.push(vertex.clone());
              foundCount++;
              break;
            }
          }
        }

        this.debugLog(
          `    Found ${foundCount} vertices influenced by wrist in mesh ${child.name}`,
        );
      }
    });

    this.debugLog(`    Total hand vertices found: ${handVertices.length}`);
    return handVertices;
  }

  private debugLog(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      log.debug(message, ...args);
    }
  }
}
