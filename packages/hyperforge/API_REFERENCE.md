# HyperForge API Reference

**Complete API documentation for all 84 endpoints.**

## Base URL

- **Development**: `http://localhost:3500`
- **Production**: `https://your-domain.com`

## Authentication

Most endpoints require no authentication. Some endpoints may require API keys via environment variables.

## Response Format

### Success Response

```typescript
{
  success: true,
  data: T,  // Response data
  message?: string
}
```

### Error Response

```typescript
{
  success: false,
  error: string,
  details?: {
    field?: string,
    validationDetails?: Record<string, string[]>
  }
}
```

## Endpoints

### Assets

#### `GET /api/assets`

List all assets with optional filtering.

**Query Parameters**:
- `category?: string` - Filter by category
- `source?: "CDN" | "LOCAL" | "BASE"` - Filter by source
- `search?: string` - Search by name
- `limit?: number` - Limit results
- `offset?: number` - Pagination offset

**Response**:
```typescript
{
  assets: AssetData[],
  total: number,
  limit: number,
  offset: number
}
```

#### `POST /api/assets/upload`

Upload a new asset.

**Request Body**:
```typescript
{
  name: string,
  category: AssetCategory,
  modelFile: File,
  thumbnailFile?: File,
  metadata?: Record<string, unknown>
}
```

**Response**:
```typescript
{
  asset: AssetData,
  files: {
    model: string,
    thumbnail?: string
  }
}
```

#### `GET /api/assets/[id]`

Get a single asset by ID.

**Response**: `AssetData`

#### `DELETE /api/assets/[id]`

Delete an asset.

**Response**: `{ success: true }`

#### `GET /api/assets/[id]/model`

Serve asset model file.

**Response**: File stream (GLB/GLTF)

#### `GET /api/assets/[id]/thumbnail`

Serve asset thumbnail.

**Response**: Image file

---

### Generation

#### `POST /api/generation`

Generate a 3D model, image, or content.

**Request Body**:
```typescript
{
  prompt: string,
  category: AssetCategory,
  pipeline: "text-to-3d" | "image-to-3d" | "concept-art",
  quality: "preview" | "medium" | "high",
  metadata?: {
    name?: string,
    description?: string
  }
}
```

**Response**:
```typescript
{
  taskId: string,
  status: "pending" | "processing" | "completed" | "failed"
}
```

#### `GET /api/generation/status?taskId=xxx`

Get generation task status.

**Response**:
```typescript
{
  taskId: string,
  status: GenerationStatus,
  progress?: number,
  result?: {
    modelUrl?: string,
    imageUrl?: string
  }
}
```

---

### Audio

#### `POST /api/audio/voice/generate`

Generate voice audio with ElevenLabs.

**Request Body**:
```typescript
{
  text: string,
  voiceId?: string,
  preset?: string,
  npcId?: string,
  dialogueNodeId?: string
}
```

**Response**:
```typescript
{
  audioUrl: string,
  duration: number,
  format: "mp3"
}
```

#### `POST /api/audio/sfx/generate`

Generate sound effect.

**Request Body**:
```typescript
{
  description: string,
  category?: string,
  preset?: string
}
```

#### `POST /api/audio/music/generate`

Generate music track.

**Request Body**:
```typescript
{
  description: string,
  genre?: string,
  durationMs?: number,
  preset?: string
}
```

#### `GET /api/audio/file/[...path]`

Serve audio file.

**Path**: `music/filename.mp3` or `sfx/filename.mp3` or `voice/npcId/dialogueId.mp3`

**Response**: Audio file stream

---

### Images

#### `POST /api/images/generate`

Generate concept art or sprite.

**Request Body**:
```typescript
{
  prompt: string,
  type: "concept-art" | "sprite" | "texture",
  style?: string,
  size?: "512x512" | "1024x1024" | "2048x2048"
}
```

**Response**:
```typescript
{
  imageUrl: string,
  thumbnailUrl: string
}
```

#### `GET /api/images`

List generated images.

**Query Parameters**: Same as `/api/assets`

#### `GET /api/images/file/[...path]`

Serve image file.

**Response**: Image file stream

---

### Content

#### `POST /api/content/generate`

Generate game content (NPC, quest, area, item).

**Request Body**:
```typescript
{
  type: "npc" | "quest" | "area" | "item",
  prompt: string,
  metadata?: Record<string, unknown>
}
```

**Response**: Generated content object

#### `POST /api/content/dialogue`

Generate or update dialogue tree.

**Request Body**:
```typescript
{
  npcId: string,
  nodes: DialogueNode[],
  edges: DialogueEdge[]
}
```

---

### Structures

#### `GET /api/structures`

List all structures.

**Query Parameters**:
- `id?: string` - Get single structure

**Response**: `StructureDefinition[]` or `StructureDefinition`

#### `POST /api/structures`

Create or update structure.

**Request Body**: `StructureDefinition`

#### `DELETE /api/structures?id=xxx`

Delete structure.

#### `POST /api/structures/pieces/generate`

Generate building piece with AI.

**Request Body**:
```typescript
{
  name: string,
  type: "wall" | "door" | "window" | "floor" | "roof",
  material: string,
  style?: string
}
```

#### `POST /api/structures/bake`

Bake pieces into single mesh.

**Request Body**:
```typescript
{
  structureId: string,
  pieces: string[]  // Piece IDs to bake
}
```

---

### VRM Conversion

#### `POST /api/vrm/convert`

Convert GLB model to VRM format.

**Request Body**:
```typescript
{
  assetId: string,
  options?: {
    preserveBones?: boolean,
    optimize?: boolean
  }
}
```

**Response**:
```typescript
{
  vrmUrl: string,
  originalModelUrl: string
}
```

---

### Armor Fitting

#### `POST /api/armor/fit`

Fit armor mesh to VRM avatar.

**Request Body**:
```typescript
{
  armorAssetId: string,
  avatarAssetId: string,
  bodyRegion: "chest" | "legs" | "arms" | "head",
  options?: {
    tightness?: number,
    preserveOpenings?: boolean
  }
}
```

**Response**:
```typescript
{
  fittedModelUrl: string,
  metadata: {
    vertexCount: number,
    triangleCount: number
  }
}
```

---

### Hand Rigging

#### `POST /api/hand-rigging/simple`

Add simple hand bones to model.

**Request Body**:
```typescript
{
  assetId: string,
  options?: {
    palmBoneLength?: number,
    fingerBoneLength?: number,
    debugMode?: boolean
  }
}
```

**Response**:
```typescript
{
  success: boolean,
  riggedModelUrl: string,
  metadata: {
    bonesAdded: number,
    handBones: HandBoneStructure
  }
}
```

---

### World Editor

#### `GET /api/world/config`

Get world configuration.

**Response**: `WorldAreasConfig`

#### `POST /api/world/config`

Update world configuration.

**Request Body**: `WorldAreasConfig`

#### `GET /api/world/entities`

List all entities in world.

**Response**: `Entity[]`

#### `POST /api/world/entities`

Create entity.

**Request Body**: `EntityDefinition`

#### `GET /api/world/entities/[id]`

Get entity by ID.

#### `PUT /api/world/entities/[id]`

Update entity.

#### `DELETE /api/world/entities/[id]`

Delete entity.

---

### Game Integration

#### `GET /api/game/manifests`

List all game manifests.

**Response**:
```typescript
{
  items: ItemManifest[],
  npcs: NPCManifest[],
  resources: ResourceManifest[],
  stores: StoreDefinition[],
  music: MusicTrackManifest[]
}
```

#### `GET /api/game/manifests/items`

Get items manifest.

#### `GET /api/game/manifests/npcs`

Get NPCs manifest.

#### `GET /api/game/manifests/resources`

Get resources manifest.

#### `GET /api/game/stores`

List all stores.

**Response**: `StoreDefinition[]`

---

### Import/Export

#### `POST /api/import`

Import assets from game manifests.

**Request Body**:
```typescript
{
  assetIds: string[],
  manifestType: "items" | "npcs" | "resources"
}
```

#### `POST /api/export`

Export assets to game manifests.

**Request Body**:
```typescript
{
  assetIds: string[],
  targetType: "items" | "npcs" | "resources"
}
```

#### `POST /api/export/promote`

Promote asset to game (copy to game repo).

**Request Body**:
```typescript
{
  assetId: string,
  targetManifest: "items" | "npcs" | "resources"
}
```

---

### Sync

#### `GET /api/sync`

Get sync status between HyperForge and game.

**Response**:
```typescript
{
  status: "synced" | "out-of-sync" | "error",
  changes: {
    added: number,
    modified: number,
    deleted: number
  }
}
```

#### `POST /api/sync`

Sync assets with game.

**Request Body**:
```typescript
{
  direction: "from-game" | "to-game",
  assetIds?: string[]  // Optional: sync specific assets
}
```

---

### Versions

#### `GET /api/versions`

List asset versions.

**Query Parameters**:
- `assetId?: string` - Filter by asset

**Response**: `AssetVersion[]`

#### `POST /api/versions`

Create new version snapshot.

**Request Body**:
```typescript
{
  assetId: string,
  description?: string
}
```

#### `GET /api/versions/[id]`

Get version details.

#### `POST /api/versions/[id]/rollback`

Rollback to version.

---

### Relationships

#### `GET /api/relationships`

Get asset relationships.

**Query Parameters**:
- `assetId: string` - Required

**Response**:
```typescript
{
  assetId: string,
  relationships: Relationship[]
}
```

#### `POST /api/relationships`

Add relationship.

**Request Body**:
```typescript
{
  sourceId: string,
  targetId: string,
  type: RelationshipType
}
```

#### `DELETE /api/relationships`

Remove relationship.

**Request Body**:
```typescript
{
  sourceId: string,
  targetId: string,
  type: RelationshipType
}
```

---

### Settings

#### `GET /api/settings/preferences`

Get user preferences.

**Query Parameters**:
- `type?: string` - Preference type

**Response**: Preferences object

#### `POST /api/settings/preferences`

Update preferences.

#### `GET /api/settings/ai-gateway/models`

List available AI models.

**Response**: `ModelConfig[]`

#### `GET /api/settings/status`

Get system status.

**Response**:
```typescript
{
  storage: {
    supabase: boolean,
    local: boolean
  },
  services: {
    meshy: boolean,
    elevenlabs: boolean,
    aiGateway: boolean
  }
}
```

---

### Agent API

#### `POST /api/agent`

Unified API for AI agents (Game Masters).

**Request Body**:
```typescript
{
  action: string,
  params: Record<string, unknown>
}
```

**Available Actions**:
- `generate-3d`, `generate-image`, `generate-voice`
- `list-assets`, `get-asset`, `export-asset`
- `place-entity`, `find-nearby`, `update-entity`
- And 50+ more (see `/api/agent` GET for full list)

**Response**: Action-specific response

#### `GET /api/agent`

Get available actions and usage.

**Response**: Action catalog with schemas

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Validation error |
| 404 | Resource not found |
| 500 | Server error |
| 503 | Service unavailable |

---

## Rate Limiting

Currently no rate limiting. Future versions may add rate limits for:
- AI generation endpoints
- External API calls
- File uploads

---

## Versioning

API versioning via URL path (future):
- `/api/v1/assets`
- `/api/v2/assets`

Currently all endpoints are unversioned (v1).

---

## Examples

### Generate 3D Model

```bash
curl -X POST http://localhost:3500/api/generation \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A bronze sword",
    "category": "weapon",
    "pipeline": "text-to-3d",
    "quality": "medium"
  }'
```

### Upload Asset

```bash
curl -X POST http://localhost:3500/api/assets/upload \
  -F "name=My Sword" \
  -F "category=weapon" \
  -F "modelFile=@sword.glb" \
  -F "thumbnailFile=@thumbnail.png"
```

### List Assets

```bash
curl "http://localhost:3500/api/assets?category=weapon&limit=10"
```

---

For implementation details, see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).
