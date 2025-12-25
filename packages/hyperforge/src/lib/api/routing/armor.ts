/**
 * Armor API Router
 * 
 * Handles armor fitting and export operations
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { createPostRoute } from "./base";
import { ValidationError, ArmorFitSchema } from "@/lib/api";
import type { ValidatedHandler } from "./types";
import type { SkinnedMesh, Mesh } from "three";

const log = logger.child("API:routing:armor");

/**
 * Fit armor to avatar
 */
export async function fitArmor(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof ArmorFitSchema.parse>,
): Promise<NextResponse> {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const { getServiceFactory } = await import("@/lib/services");
  const { MeshFittingService } = await import("@/services/fitting");

  const { avatarUrl, armorUrl, config = {} } = body;

  const loader = new GLTFLoader();
  const factory = getServiceFactory();
  const armorFittingService = factory.getArmorFittingService();
  const meshFittingService = new MeshFittingService();

  log.info("Loading models", { avatarUrl, armorUrl });

  const [avatarGltf, armorGltf] = await Promise.all([
    loader.loadAsync(avatarUrl),
    loader.loadAsync(armorUrl),
  ]);

  const avatarMesh = avatarGltf.scene.getObjectByName("Avatar") as SkinnedMesh;
  const armorMesh = armorGltf.scene.children[0] as Mesh;

  if (!avatarMesh || !armorMesh) {
    throw new ValidationError("Invalid model structure", {
      context: { avatarUrl, armorUrl },
    });
  }

  // Step 1: Fit armor to body using shrinkwrap
  meshFittingService.fitArmorToBody(
    armorMesh,
    avatarMesh as unknown as Mesh, // MeshFittingService expects Mesh, not SkinnedMesh
    {
      targetOffset: config.targetOffset ?? 0.02,
      iterations: config.iterations ?? 10,
      rigidity: config.rigidity ?? 0.7,
      smoothingPasses: config.smoothingPasses ?? 3,
    },
  );

  // Step 2: Bind armor to skeleton
  const fittedMesh = armorFittingService.bindArmorToSkeleton(
    armorMesh,
    avatarMesh,
    {
      searchRadius: 0.05, // Default search radius (not in config schema)
      applyGeometryTransform: true,
    },
  );

  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();

  const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      fittedMesh,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error("Export failed"));
        }
      },
      (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      },
      { binary: true },
    );
  });

  const glbBase64 = Buffer.from(glbBuffer).toString("base64");

  return NextResponse.json({
    success: true,
    glbData: glbBase64,
    message: "Armor fitted successfully",
  });
}

/**
 * Export armor (fits and returns GLB for download)
 */
export async function exportArmor(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof ArmorFitSchema.parse>,
): Promise<NextResponse> {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const { getServiceFactory } = await import("@/lib/services");
  const { MeshFittingService } = await import("@/services/fitting");

  const { avatarUrl, armorUrl, config = {} } = body;

  const loader = new GLTFLoader();
  const factory = getServiceFactory();
  const armorFittingService = factory.getArmorFittingService();
  const meshFittingService = new MeshFittingService();

  log.info("Loading models for export", { avatarUrl, armorUrl });

  const [avatarGltf, armorGltf] = await Promise.all([
    loader.loadAsync(avatarUrl),
    loader.loadAsync(armorUrl),
  ]);

  const avatarMesh = avatarGltf.scene.getObjectByName("Avatar") as SkinnedMesh;
  const armorMesh = armorGltf.scene.children[0] as Mesh;

  if (!avatarMesh || !armorMesh) {
    throw new ValidationError("Invalid model structure", {
      context: { avatarUrl, armorUrl },
    });
  }

  // Step 1: Fit armor to body using shrinkwrap
  meshFittingService.fitArmorToBody(
    armorMesh,
    avatarMesh as unknown as Mesh, // MeshFittingService expects Mesh, not SkinnedMesh
    {
      targetOffset: config.targetOffset ?? 0.02,
      iterations: config.iterations ?? 10,
      rigidity: config.rigidity ?? 0.7,
      smoothingPasses: config.smoothingPasses ?? 3,
    },
  );

  // Step 2: Bind armor to skeleton
  const fittedMesh = armorFittingService.bindArmorToSkeleton(
    armorMesh,
    avatarMesh,
    {
      searchRadius: 0.05, // Default search radius (not in config schema)
      applyGeometryTransform: true,
    },
  );

  // Export using the armor fitting service's export method
  const exportMethod = (config as { exportMethod?: string }).exportMethod || "full";
  const glbBuffer = await armorFittingService.exportFittedArmor(
    fittedMesh,
    { method: exportMethod as "minimal" | "full" | "static" },
  );

  // Return as binary GLB for download
  return new NextResponse(glbBuffer, {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Content-Disposition": `attachment; filename="armor-fitted.glb"`,
    },
  });
}

/**
 * Armor API routes
 */
export const armorRoutes = {
  POST: {
    fit: createPostRoute(
      ArmorFitSchema,
      fitArmor as ValidatedHandler<ReturnType<typeof ArmorFitSchema.parse>>,
    ),
    export: createPostRoute(
      ArmorFitSchema,
      exportArmor as ValidatedHandler<ReturnType<typeof ArmorFitSchema.parse>>,
    ),
  },
};
