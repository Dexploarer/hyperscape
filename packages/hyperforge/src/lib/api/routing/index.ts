/**
 * API Routing Layer
 * 
 * Centralized domain-specific routing for API routes
 * 
 * @example
 * ```typescript
 * import { assetsRoutes, audioRoutes, generationRoutes } from "@/lib/api/routing";
 * 
 * // In route.ts
 * export const GET = assetsRoutes.GET.list;
 * export const POST = assetsRoutes.POST.upload;
 * ```
 */

export * from "./types";
export * from "./base";
export * from "./assets";
export * from "./audio";
export * from "./generation";
export * from "./images";
export * from "./content";
export * from "./settings";
export * from "./game";
export * from "./structures";
export * from "./enhancement";
export * from "./world";
export * from "./hand-rigging";
export * from "./versions";
export * from "./relationships";
export * from "./vrm";
export * from "./armor";
export * from "./weapon";
export * from "./export-import";
export * from "./templates";
export * from "./bulk";
export * from "./variants";
export * from "./sprites";
export * from "./emotes";
export * from "./sync";
export * from "./upload";
export * from "./meshy";
