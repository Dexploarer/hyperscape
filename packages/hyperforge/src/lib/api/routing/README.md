# API Routing Layer

Consolidated domain-specific routing for HyperForge API routes. This layer reduces duplication by centralizing common patterns and operations.

## Architecture

The routing layer is organized by domain:

- **`base.ts`** - Common utilities (query parsing, response helpers, route factories)
- **`assets.ts`** - Asset operations (query, upload, delete, file serving)
- **`audio.ts`** - Audio operations (voice generation, file serving)
- **`generation.ts`** - Generation operations (3D model generation, concept art, status)

## Usage

### Assets Routes

```typescript
import { assetsRoutes } from "@/lib/api/routing";

// In route.ts
export const GET = assetsRoutes.GET.list;  // Query assets
export const POST = assetsRoutes.POST.upload;  // Upload asset
export const DELETE = assetsRoutes.DELETE.byId(assetId);  // Delete asset
```

### Audio Routes

```typescript
import { audioRoutes } from "@/lib/api/routing";

// In route.ts
export const POST = audioRoutes.POST.generateVoice;  // Generate voice
export const GET = audioRoutes.GET.file(filePath);  // Serve audio file
```

### Generation Routes

```typescript
import { generationRoutes } from "@/lib/api/routing";

// In route.ts
export const POST = generationRoutes.POST.generate;  // Handle generation requests
```

## Benefits

1. **Reduced Duplication** - Common patterns (validation, error handling, response formatting) are centralized
2. **Consistency** - All routes follow the same patterns and conventions
3. **Maintainability** - Changes to common logic only need to be made in one place
4. **Type Safety** - Shared types ensure consistency across routes
5. **Testability** - Domain logic can be tested independently of route handlers

## Migration Status

✅ **Completed:**
- `/api/assets` - List assets
- `/api/assets/upload` - Upload assets
- `/api/audio/voice/generate` - Generate voice
- `/api/audio/file/[...path]` - Serve audio files
- `/api/generation` - Generation operations
- `/api/structures` - Structure CRUD operations
- `/api/versions` - Version control operations
- `/api/world` - World editor operations
- `/api/relationships` - Asset relationships
- `/api/vrm` - VRM conversion
- `/api/armor` - Armor fitting
- `/api/hand-rigging` - Hand rigging
- `/api/export` - Asset export
- `/api/import` - Manifest import
- `/api/sync` - Sync operations
- `/api/variants` - Asset variants
- `/api/templates` - Asset templates
- `/api/bulk` - Bulk operations
- `/api/sprites` - Sprite generation
- `/api/emotes` - Emote management
- `/api/meshy` - Meshy API proxy
- `/api/game` - Game data access
- `/api/settings` - Settings management
- `/api/content` - Content generation
- `/api/enhancement` - Asset enhancement
- `/api/upload` - File uploads

**Note**: Most routes now use the unified routing layer. Legacy routes that don't use it are being migrated incrementally.

## Adding New Routes

When adding new routes, prefer using the routing layer:

1. Check if functionality exists in a domain router
2. If not, add it to the appropriate domain router
3. Export it from the domain router's routes object
4. Use it in your route handler

Example:

```typescript
// In lib/api/routing/assets.ts
export async function getAssetMetadata(assetId: string): Promise<NextResponse> {
  // Implementation
}

export const assetsRoutes = {
  // ... existing routes
  GET: {
    // ... existing GET routes
    metadata: (assetId: string) => createGetRoute(() => getAssetMetadata(assetId))(),
  },
};

// In app/api/assets/[id]/metadata/route.ts
import { assetsRoutes } from "@/lib/api/routing";

export const GET = async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  return assetsRoutes.GET.metadata(id)();
};
```
