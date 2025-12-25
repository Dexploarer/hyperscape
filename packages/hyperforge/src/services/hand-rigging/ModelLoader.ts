/**
 * Model Loader
 * 
 * Handles loading 3D models from files or URLs
 */

import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

/**
 * Service for loading 3D models
 */
export class ModelLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Load model from file or URL
   */
  async loadModel(modelFile: File | string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const url =
        typeof modelFile === "string"
          ? modelFile
          : URL.createObjectURL(modelFile);

      this.loader.load(
        url,
        (gltf: GLTF) => {
          if (typeof modelFile !== "string") {
            URL.revokeObjectURL(url);
          }
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          if (typeof modelFile !== "string") {
            URL.revokeObjectURL(url);
          }
          // Type assertion for known error types
          const typedError = error as ErrorEvent | Error | string;
          reject(typedError);
        },
      );
    });
  }
}
