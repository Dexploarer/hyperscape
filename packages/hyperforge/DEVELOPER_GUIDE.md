# HyperForge Developer Guide

**Complete guide for developers working with or extending HyperForge.**

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Type System](#type-system)
3. [API Development](#api-development)
4. [Storage System](#storage-system)
5. [Adding New Features](#adding-new-features)
6. [Service Integration](#service-integration)
7. [Testing Guidelines](#testing-guidelines)
8. [Performance Optimization](#performance-optimization)
9. [Code Organization](#code-organization)

---

## Architecture Overview

HyperForge follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│  UI Layer (React Components)                    │
│  - Generation forms, viewers, panels              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  API Layer (Next.js Route Handlers)             │
│  - 84 API endpoints with unified routing        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Service Layer (Domain Logic)                   │
│  - Fitting, rigging, VRM, generation             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Storage Layer (Unified Storage Service)        │
│  - Supabase-first with local fallback           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  External APIs                                   │
│  - Meshy, ElevenLabs, AI Gateway                │
└─────────────────────────────────────────────────┘
```

### Core Principles

1. **Type Safety First**: Zero `any` types (except legitimate cases in versioning)
2. **Unified Patterns**: All similar operations use the same abstractions
3. **Validation Everywhere**: Zod schemas for all API boundaries
4. **Modular Design**: Clear module boundaries with barrel exports
5. **Documentation**: JSDoc for all public APIs

---

## Type System

### Type Organization

All types are centralized in `src/types/`:

- **`core.ts`**: Foundational types (AssetSource, Category, Rarity, Combat)
- **`asset.ts`**: Asset storage types (CDN, Local, Base)
- **`manifest.ts`**: Game manifest types
- **`generation.ts`**: AI generation pipeline types
- **`audio.ts`**: Audio asset types
- **`guards.ts`**: Runtime type guards
- **`utils.ts`**: Utility types (Result, Option, Branded IDs)

### Import Pattern

```typescript
// ✅ CORRECT - Import from unified types
import type { AssetData, CDNAsset, LocalAsset } from "@/types";

// ❌ WRONG - Don't import from internal modules
import type { AssetData } from "@/lib/cdn/types";
```

### Type Guards

Use type guards for runtime narrowing:

```typescript
import { isCDNAsset, isLocalAsset } from "@/types";

if (isCDNAsset(asset)) {
  // TypeScript knows asset is CDNAsset here
  console.log(asset.modelPath); // ✅ Type-safe
}
```

### Branded Types

Prevent mixing different ID strings:

```typescript
import type { AssetId, UserId } from "@/types";

const assetId: AssetId = createAssetId("sword-123");
const userId: UserId = createUserId("user-456");

// assetId = userId; // ❌ Compile error!
```

---

## API Development

### Unified Routing Layer

All API routes use the **routing layer** (`src/lib/api/routing/`):

```typescript
// ✅ CORRECT - Use routing layer
import { assetsRoutes } from "@/lib/api/routing";

export const GET = assetsRoutes.GET.list;
export const POST = assetsRoutes.POST.upload;
```

### Adding a New API Route

1. **Create handler in routing layer**:

```typescript
// src/lib/api/routing/my-feature.ts
import { createGetRoute, createPostRoute } from "./base";
import { MyFeatureSchema } from "@/lib/api/schemas";

export async function getMyFeature(
  request: NextRequest,
): Promise<NextResponse> {
  // Implementation
}

export async function createMyFeature(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof MyFeatureSchema.parse>,
): Promise<NextResponse> {
  // Implementation
}

export const myFeatureRoutes = {
  GET: {
    list: createGetRoute(getMyFeature),
  },
  POST: {
    create: createPostRoute(MyFeatureSchema, createMyFeature),
  },
};
```

2. **Create Zod schema**:

```typescript
// src/lib/api/schemas/my-feature.ts
import { z } from "zod";

export const MyFeatureSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["type1", "type2"]),
  metadata: z.record(z.unknown()).optional(),
});
```

3. **Export from schemas index**:

```typescript
// src/lib/api/schemas/index.ts
export * from "./my-feature";
```

4. **Create route handler**:

```typescript
// src/app/api/my-feature/route.ts
import { myFeatureRoutes } from "@/lib/api/routing";

export const GET = myFeatureRoutes.GET.list;
export const POST = myFeatureRoutes.POST.create;
```

### Error Handling

All routes use `withErrorHandling`:

```typescript
import { withErrorHandling, ValidationError } from "@/lib/api";

export const POST = withErrorHandling(async (request) => {
  const body = await request.json();
  
  if (!body.name) {
    throw new ValidationError("Name is required", { field: "name" });
  }
  
  // Implementation
});
```

### Response Formatting

Use consistent response helpers:

```typescript
import { successResponse, validationErrorResponse } from "@/lib/api/routing/base";

// Success
return successResponse({ data: result });

// Validation error
return NextResponse.json(
  validationErrorResponse(zodError),
  { status: 400 }
);
```

---

## Storage System

### Unified Storage Service

**Always use `StorageService`** for file operations:

```typescript
import { storageService } from "@/lib/storage";

// Upload model
const result = await storageService.uploadModel(buffer, {
  assetId: "sword-123",
  format: "glb",
  thumbnailBuffer,
});

// Upload audio
const result = await storageService.uploadAudio(buffer, {
  type: "sfx",
  name: "sword-clash",
  category: "combat",
});

// Upload image
const result = await storageService.uploadImage(buffer, {
  type: "concept-art",
  filename: "sword-concept",
  assetId: "sword-123",
});
```

### Storage Strategy

1. **Supabase-first**: Tries Supabase storage first
2. **Local fallback**: Falls back to local filesystem if Supabase unavailable
3. **Automatic path resolution**: Handles CDN, Supabase, and local paths

### Bucket Organization

Supabase buckets (7 total):
- `image-generation`: Concept art, sprites
- `audio-generations`: Voice, SFX, music
- `content-generations`: Game content (quests, dialogues)
- `meshy-models`: 3D models from Meshy
- `vrm-conversion`: VRM converted models
- `concept-art-pipeline`: Legacy metadata
- `baked-structures`: Baked building meshes

---

## Adding New Features

### 1. Define Types

```typescript
// src/types/my-feature.ts
export interface MyFeature {
  id: string;
  name: string;
  // ... other fields
}

export type MyFeatureStatus = "draft" | "active" | "archived";
```

### 2. Create Service

```typescript
// src/services/my-feature/MyFeatureService.ts
import { logger } from "@/lib/utils";

const log = logger.child("MyFeatureService");

export class MyFeatureService {
  async create(feature: MyFeature): Promise<MyFeature> {
    log.info("Creating feature", { id: feature.id });
    // Implementation
    return feature;
  }
}
```

### 3. Add to Service Factory

```typescript
// src/lib/services/service-factory.ts
import { MyFeatureService } from "@/services/my-feature/MyFeatureService";

export class ServiceFactory {
  private myFeatureService?: MyFeatureService;

  getMyFeatureService(): MyFeatureService {
    if (!this.myFeatureService) {
      this.myFeatureService = new MyFeatureService();
    }
    return this.myFeatureService;
  }
}
```

### 4. Create API Route

Follow the [API Development](#api-development) pattern above.

### 5. Create React Hook (if needed)

```typescript
// src/hooks/useMyFeature.ts
import { useState, useEffect } from "react";
import { useFetch } from "./useFetch";

export function useMyFeature(id: string) {
  const { data, isLoading, error } = useFetch(`/api/my-feature?id=${id}`);
  
  return {
    feature: data,
    isLoading,
    error,
  };
}
```

### 6. Create Component (if needed)

```typescript
// src/components/my-feature/MyFeaturePanel.tsx
import { useMyFeature } from "@/hooks/useMyFeature";

export function MyFeaturePanel({ id }: { id: string }) {
  const { feature, isLoading } = useMyFeature(id);
  
  if (isLoading) return <div>Loading...</div>;
  if (!feature) return <div>Not found</div>;
  
  return <div>{feature.name}</div>;
}
```

---

## Service Integration

### Service Factory Pattern

**Always use ServiceFactory** for service access:

```typescript
import { getServiceFactory } from "@/lib/services";

const factory = getServiceFactory();
const armorService = factory.getArmorFittingService();
const vrmService = factory.getVRMConverter();
```

### Adding a New Service

1. Create service class
2. Add to `ServiceFactory`
3. Export from `src/lib/services/index.ts`

```typescript
// src/lib/services/index.ts
export { MyFeatureService } from "@/services/my-feature/MyFeatureService";
```

---

## Testing Guidelines

### Unit Tests

- **Location**: `src/**/__tests__/*.test.ts`
- **Framework**: Vitest
- **NO MOCKS**: Use real implementations
- **Coverage**: Test all public APIs

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../my-module";

describe("MyModule", () => {
  it("does something", () => {
    const result = myFunction("input");
    expect(result).toBeDefined();
  });
});
```

### E2E Tests

- **Location**: `e2e/*.spec.ts`
- **Framework**: Playwright
- **Visual Testing**: Screenshots + Three.js scene queries
- **Real Worlds**: Create actual Hyperscape instances

---

## Performance Optimization

### Three.js Best Practices

- **Polycount Limits**: 
  - Small props: 500-2K triangles
  - NPCs: 2K-10K triangles (ideally ~5K)
  - Buildings: 2K-8K triangles (with LOD)

- **LOD (Level of Detail)**: Provide multiple LOD meshes
- **Instancing**: Use for frequently repeated objects
- **Baking**: Normal/roughness/AO maps to reduce polycount

### Code Optimization

- **Tree-shaking**: Use named exports, not `export *`
- **Lazy Loading**: Dynamic imports for heavy services
- **Caching**: In-memory caches with TTL for manifests
- **Batch Operations**: Process multiple items together

---

## Code Organization

### Module Structure

```
src/
├── lib/              # Core libraries
│   ├── api/         # API routing & schemas
│   ├── storage/     # Storage services
│   ├── ai/          # AI Gateway integration
│   ├── meshy/       # Meshy 3D generation
│   └── utils/       # Utility functions
├── services/        # Domain services
├── components/     # React components
├── hooks/          # React hooks
├── stores/         # Zustand stores
└── types/          # TypeScript types
```

### Barrel Exports

Each module has an `index.ts` for clean imports:

```typescript
// ✅ CORRECT
import { storageService } from "@/lib/storage";
import { generateTextWithProvider } from "@/lib/ai";

// ❌ WRONG
import { storageService } from "@/lib/storage/storage-service";
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `asset-converter.ts`)
- **Types**: `PascalCase` (e.g., `AssetData`)
- **Functions**: `camelCase` (e.g., `generateAssetId`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_POLYCOUNT`)

---

## Validation Strategy

### Zod Schemas

Use Zod for:
- ✅ API request/response validation
- ✅ JSON parsing with validation
- ✅ Complex nested object validation

```typescript
import { z } from "zod";

const MySchema = z.object({
  name: z.string().min(1),
  count: z.number().int().positive(),
});

const result = MySchema.safeParse(data);
if (!result.success) {
  // Handle validation error
}
```

### Type Guards

Use type guards for:
- ✅ Runtime type narrowing in conditionals
- ✅ Quick property checks
- ✅ Discriminated union narrowing

```typescript
import { isCDNAsset } from "@/types";

if (isCDNAsset(asset)) {
  // TypeScript narrows to CDNAsset
}
```

---

## Extension Points

### Adding New Asset Types

1. Add category to `src/types/core.ts`:
```typescript
export type AssetCategory = 
  | "weapon"
  | "armor"
  | "my-new-type"; // Add here
```

2. Add to category schemas:
```typescript
// src/lib/generation/category-schemas.ts
export const MyNewTypeSchema = z.object({
  // ... fields
});
```

3. Add generation form:
```typescript
// src/components/generation/forms/MyNewTypeForm.tsx
export function MyNewTypeForm({ ... }) {
  // Implementation
}
```

### Adding New Storage Backends

Extend `StorageService`:

```typescript
// src/lib/storage/storage-service.ts
class StorageService {
  private adapters: StorageAdapter[] = [
    new SupabaseAdapter(),
    new LocalAdapter(),
    new MyNewBackendAdapter(), // Add here
  ];
}
```

### Adding New AI Providers

Extend AI Gateway integration:

```typescript
// src/lib/ai/gateway.ts
export async function generateWithMyProvider(
  prompt: string,
  options: MyProviderOptions
): Promise<string> {
  // Implementation using AI Gateway
}
```

---

## Common Patterns

### Error Handling

```typescript
import { withErrorHandling, ValidationError, StorageError } from "@/lib/api";

export const handler = withErrorHandling(async (request) => {
  try {
    // Operation
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation error
    } else if (error instanceof StorageError) {
      // Handle storage error
    } else {
      throw error; // Re-throw unknown errors
    }
  }
});
```

### Logging

```typescript
import { logger } from "@/lib/utils";

const log = logger.child("MyModule");

log.info("Operation started", { id });
log.error("Operation failed", { error, id });
log.debug("Debug info", { data });
```

### Async Operations

```typescript
import { retryFetch } from "@/lib/utils/api";

const result = await retryFetch(
  async () => {
    return await externalApi.call();
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
  }
);
```

---

## Best Practices

### ✅ DO

- Use unified storage service for all file operations
- Use routing layer for all API routes
- Use Zod schemas for validation
- Use type guards for runtime narrowing
- Use ServiceFactory for service access
- Use barrel exports (index.ts) for clean imports
- Use Pino logger (never console.log)
- Write tests for all public APIs
- Document public APIs with JSDoc

### ❌ DON'T

- Don't use `any` types (except legitimate cases)
- Don't bypass unified storage
- Don't create duplicate implementations
- Don't use console.log/warn/error
- Don't skip validation
- Don't create new files unnecessarily
- Don't use mocks in tests (use real implementations)
- Don't hardcode data (use JSON/config files)

---

## Troubleshooting

### Type Errors

1. Check if type exists in `src/types/`
2. Import from unified types (`@/types`)
3. Use type guards for runtime narrowing
4. Check discriminated unions are properly discriminated

### Storage Issues

1. Check Supabase configuration
2. Verify bucket names match `BUCKET_NAMES` constant
3. Check local filesystem fallback paths
4. Review storage service logs

### API Route Issues

1. Verify Zod schema matches request body
2. Check error handling wrapper
3. Verify response format matches schema
4. Check routing layer exports

---

## Resources

- **Main README**: [README.md](./README.md)
- **API Routing**: [src/lib/api/routing/README.md](./src/lib/api/routing/README.md)
- **AI Services**: [src/lib/ai/README.md](./src/lib/ai/README.md)
- **Type Definitions**: [src/types/index.ts](./src/types/index.ts)

---

## Questions?

If you're unsure about how to implement something:
1. Check existing similar implementations
2. Review this guide
3. Check module-specific READMEs
4. Review type definitions for contracts
