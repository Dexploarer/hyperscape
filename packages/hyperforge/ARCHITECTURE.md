# HyperForge Architecture

**Deep dive into HyperForge's architecture, design decisions, and system interactions.**

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Abstractions](#core-abstractions)
3. [Data Flow](#data-flow)
4. [Storage Architecture](#storage-architecture)
5. [API Architecture](#api-architecture)
6. [Type System Architecture](#type-system-architecture)
7. [Service Architecture](#service-architecture)
8. [Integration Points](#integration-points)

---

## System Overview

HyperForge is a **Next.js 15 application** that provides AI-powered content generation for the Hyperscape game. It follows a **layered, modular architecture** with clear separation between UI, API, services, and storage.

### Key Design Decisions

1. **Unified Storage**: Single `StorageService` abstraction over Supabase + local filesystem
2. **Unified API Routing**: Domain-specific routers centralize common patterns
3. **Type-First Development**: Types defined before implementation
4. **Validation at Boundaries**: Zod schemas for all API inputs/outputs
5. **Service Factory**: Centralized service initialization and lifecycle

---

## Core Abstractions

### 1. Unified Storage Service

**Purpose**: Abstract away storage backend differences (Supabase vs. local filesystem)

**Implementation**: `src/lib/storage/storage-service.ts`

```typescript
class StorageService {
  private adapters: StorageAdapter[] = [
    new SupabaseAdapter(),  // Primary
    new LocalAdapter(),      // Fallback
  ];

  async uploadModel(buffer: Buffer, options: ModelUploadOptions): Promise<UploadResult> {
    // Try Supabase first, fallback to local
    for (const adapter of this.adapters) {
      if (await adapter.isAvailable()) {
        return await adapter.uploadModel(buffer, options);
      }
    }
    throw new StorageError("No storage backend available");
  }
}
```

**Benefits**:
- Single API for all storage operations
- Automatic fallback handling
- Consistent error handling
- Easy to add new backends

### 2. API Routing Layer

**Purpose**: Centralize common API patterns (validation, error handling, response formatting)

**Implementation**: `src/lib/api/routing/`

```typescript
// Domain router
export const assetsRoutes = {
  GET: {
    list: createGetRoute(listAssets),
  },
  POST: {
    upload: createPostRoute(UploadSchema, uploadAsset),
  },
};

// Route handler
export const GET = assetsRoutes.GET.list;
```

**Benefits**:
- Reduced duplication
- Consistent patterns
- Type-safe handlers
- Testable domain logic

### 3. Type System

**Purpose**: Compile-time and runtime type safety

**Layers**:
1. **TypeScript Types**: Compile-time checking
2. **Zod Schemas**: Runtime validation
3. **Type Guards**: Runtime narrowing

```typescript
// Type definition
export interface AssetData {
  id: string;
  name: string;
  source: AssetSource;
}

// Zod schema
export const AssetDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source: AssetSourceSchema,
});

// Type guard
export function isAssetData(value: unknown): value is AssetData {
  return AssetDataSchema.safeParse(value).success;
}
```

---

## Data Flow

### Asset Generation Flow

```
User Input (Form)
    ↓
GenerationConfig (Zod validated)
    ↓
GenerationService
    ↓
Meshy API / AI Gateway
    ↓
StorageService (Supabase → Local)
    ↓
Asset Registry (in-memory cache)
    ↓
UI Update (React state)
```

### API Request Flow

```
HTTP Request
    ↓
Next.js Route Handler
    ↓
withErrorHandling wrapper
    ↓
Zod Schema Validation
    ↓
Domain Router Handler
    ↓
Service Layer
    ↓
StorageService / External API
    ↓
Response (JSON / File)
```

---

## Storage Architecture

### Three-Tier Storage Strategy

1. **Supabase Storage** (Primary)
   - Cloud-hosted S3-compatible storage
   - 7 buckets for different asset types
   - Public URLs for CDN delivery

2. **Local Filesystem** (Fallback)
   - `assets/` directory structure
   - Organized by asset type
   - Used when Supabase unavailable

3. **CDN** (Read-only)
   - Game assets from GitHub repo
   - Served via Cloudflare
   - Cached in-memory with TTL

### Storage Path Resolution

```typescript
// Unified path resolution
const url = resolveAssetUrl(asset, "model");
// Returns: CDN URL → Supabase URL → Local URL
```

### Bucket Organization

```
Supabase Buckets:
├── image-generation/     → Concept art, sprites
├── audio-generations/    → Voice, SFX, music
├── content-generations/  → Quests, dialogues
├── meshy-models/         → 3D models from Meshy
├── vrm-conversion/       → VRM converted models
├── concept-art-pipeline/ → Legacy metadata
└── baked-structures/     → Baked building meshes
```

---

## API Architecture

### Route Handler Pattern

All routes follow this pattern:

```typescript
// 1. Define handler in routing layer
export async function listAssets(
  request: NextRequest,
): Promise<NextResponse> {
  // Domain logic
}

// 2. Create route factory
export const assetsRoutes = {
  GET: {
    list: createGetRoute(listAssets),
  },
};

// 3. Use in route.ts
export const GET = assetsRoutes.GET.list;
```

### Validation Flow

```typescript
// Request → Validation → Handler → Response

Request Body
    ↓
Zod Schema.safeParse()
    ↓
ValidationError? → 400 Response
    ↓
Valid Data → Handler
    ↓
Service Layer
    ↓
Success Response
```

### Error Handling

```typescript
// All routes wrapped in withErrorHandling
export const handler = withErrorHandling(async (request) => {
  // Automatic:
  // - Error catching
  // - Error categorization
  // - Structured error responses
  // - Error logging
});
```

---

## Type System Architecture

### Three-Layer Type Safety

1. **Compile-Time** (TypeScript)
   - Interface definitions
   - Type inference
   - Discriminated unions

2. **Runtime Validation** (Zod)
   - API boundaries
   - JSON parsing
   - Complex validation

3. **Runtime Narrowing** (Type Guards)
   - Conditional checks
   - Union type narrowing
   - Property existence

### Type Organization

```
src/types/
├── core.ts          → Foundational types
├── asset.ts         → Asset storage types
├── manifest.ts      → Game manifest types
├── generation.ts    → AI generation types
├── audio.ts         → Audio asset types
├── guards.ts        → Type guards
└── utils.ts         → Utility types
```

### Discriminated Unions

```typescript
// Asset source discrimination
export type AssetData = 
  | CDNAsset      // source: "CDN"
  | LocalAsset    // source: "LOCAL"
  | BaseAsset;    // source: "BASE"

// Type guard narrows correctly
if (isCDNAsset(asset)) {
  // TypeScript knows: asset.modelPath exists
}
```

---

## Service Architecture

### Service Factory Pattern

**Purpose**: Centralized service initialization and lifecycle management

```typescript
class ServiceFactory {
  private services = new Map<string, Service>();
  
  getArmorFittingService(): ArmorFittingService {
    return this.getOrCreate("armor", () => new ArmorFittingService());
  }
}
```

**Benefits**:
- Singleton pattern
- Lazy initialization
- Easy mocking for tests
- Future DI support

### Service Categories

1. **Fitting Services**: Armor, weapon attachment
2. **Rigging Services**: Hand rigging, skeleton management
3. **VRM Services**: GLB to VRM conversion
4. **Generation Services**: Sprite generation, content generation
5. **Processing Services**: Asset normalization, mesh processing

---

## Integration Points

### External APIs

1. **Meshy API** (`src/lib/meshy/`)
   - Text-to-3D
   - Image-to-3D
   - Retexture
   - Rigging

2. **Vercel AI Gateway** (`src/lib/ai/`)
   - Text generation
   - Image generation
   - Structured output
   - Image analysis

3. **ElevenLabs** (`src/lib/audio/`)
   - Voice TTS
   - Sound effects
   - Music generation

### Game Integration

1. **CDN Asset Loading** (`src/lib/cdn/`)
   - Loads game manifests
   - Resolves asset URLs
   - Caches in-memory

2. **Manifest Import/Export** (`src/lib/import/`, `src/lib/export/`)
   - Syncs with game manifests
   - Detects changes
   - Exports to game format

3. **World Editor** (`src/lib/world/`)
   - Tile-based spawn placement
   - Live server sync
   - Undo/redo

---

## Module Dependencies

```
types/ (no dependencies)
    ↓
utils/ (depends on types)
    ↓
storage/ (depends on utils, types)
    ↓
api/ (depends on storage, utils, types)
    ↓
services/ (depends on api, storage, utils, types)
    ↓
components/ (depends on all)
```

**Key Principle**: Lower layers don't depend on higher layers.

---

## Extension Points

### Adding New Asset Categories

1. Add to `AssetCategory` type
2. Add category schema
3. Add generation form
4. Add to routing layer

### Adding New Storage Backends

1. Implement `StorageAdapter` interface
2. Add to `StorageService.adapters` array
3. Implement all required methods

### Adding New AI Providers

1. Extend AI Gateway integration
2. Add provider configuration
3. Add to task-specific model recommendations

---

## Performance Considerations

### Caching Strategy

- **Manifests**: 5-minute TTL in-memory cache
- **Asset Registry**: In-memory with invalidation
- **CDN Assets**: Cached on first load

### Optimization Techniques

- **Tree-shaking**: Named exports only
- **Lazy Loading**: Dynamic imports for heavy services
- **Batch Operations**: Process multiple items together
- **Polycount Control**: Game-optimized mesh presets

---

## Security Considerations

1. **API Key Management**: Environment variables only
2. **Validation**: All inputs validated with Zod
3. **Error Messages**: No sensitive data in errors
4. **Storage Access**: Bucket-level permissions
5. **Type Safety**: Prevents injection attacks

---

## Future Enhancements

### Planned Improvements

1. **Dependency Injection**: Replace ServiceFactory with DI container
2. **Event System**: Pub/sub for cross-module communication
3. **Plugin System**: Allow external plugins
4. **GraphQL API**: Alternative to REST
5. **WebSocket Support**: Real-time updates

---

## Conclusion

HyperForge's architecture prioritizes:
- **Type Safety**: Zero `any` types, comprehensive validation
- **Unification**: Single abstractions for similar operations
- **Modularity**: Clear boundaries, easy to extend
- **Performance**: Optimized for game asset generation
- **Developer Experience**: Clear patterns, comprehensive docs

For implementation details, see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).
