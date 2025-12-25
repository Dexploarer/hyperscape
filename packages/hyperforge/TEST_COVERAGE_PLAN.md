# HyperForge Test Coverage Plan

**Systematic plan to increase test coverage while maintaining existing standards (no mocks, real implementations, Playwright for E2E).**

## Current State

### Coverage by Category

| Category | Total Files | Test Files | Coverage % | Priority |
|----------|-------------|------------|------------|----------|
| **Components** | ~292 | ~10 | ~3% | 🔴 HIGH |
| **API Routes** | 84 | ~5 | ~6% | 🔴 HIGH |
| **Hooks** | ~10 | ~7 | ~70% | 🟡 MEDIUM |
| **Services** | ~50 | ~15 | ~30% | 🟡 MEDIUM |
| **Lib Utils** | ~100 | ~30 | ~30% | 🟢 LOW |
| **E2E Tests** | N/A | 12 | N/A | 🔴 HIGH |

### Testing Standards

1. **NO MOCKS**: Use real implementations only
2. **Real Runtime**: Test actual behavior, not abstractions
3. **Visual Testing**: Screenshots + Three.js scene queries (Playwright)
4. **Type Safety**: All tests must be fully typed
5. **Error Logging**: Save logs to `/logs/` folder
6. **Comprehensive**: Test all public APIs and user workflows

---

## Test Coverage Goals

### Target Coverage

- **Components**: 80%+ (from 3%)
- **API Routes**: 90%+ (from 6%)
- **Hooks**: 100% (from 70%)
- **Services**: 80%+ (from 30%)
- **Lib Utils**: 80%+ (from 30%)
- **E2E Tests**: All critical user workflows

---

## Implementation Plan

### Phase 1: Critical Components (Priority 1)

**Components that need tests immediately:**

1. **Generation Forms** (8 components)
   - `WeaponGenerationForm.tsx`
   - `ArmorGenerationForm.tsx`
   - `ToolGenerationForm.tsx`
   - `NPCGenerationForm.tsx`
   - `PropGenerationForm.tsx`
   - `ResourceGenerationForm.tsx`
   - `EnvironmentGenerationForm.tsx`
   - `BuildingGenerationForm.tsx`

2. **Core Viewers** (3 components)
   - `ModelViewer.tsx`
   - `VRMViewer.tsx`
   - `Viewport3D.tsx`

3. **Properties Panel** (12 components)
   - `PropertiesPanel/index.tsx`
   - `PropertiesPanel/ActionsTab.tsx`
   - `PropertiesPanel/AssetHeader.tsx`
   - `PropertiesPanel/InformationTab.tsx`
   - `PropertiesPanel/MetadataTab.tsx`
   - `PropertiesPanel/MeshStatistics.tsx`
   - `PropertiesPanel/GenerationStyleSection.tsx`
   - `PropertiesPanel/NPCGameDataSection.tsx`
   - `PropertiesPanel/ResourceGameDataSection.tsx`
   - `PropertiesPanel/StoreAvailability.tsx`
   - `PropertiesPanel/ItemDropSources.tsx`

4. **World Editor** (4 components)
   - `WorldCanvas.tsx`
   - `EntityPalette.tsx`
   - `TileGridEditor.tsx`
   - `TileInspector.tsx` (already has test, verify it's complete)

### Phase 2: API Routes (Priority 1)

**All 84 API routes need tests:**

1. **Asset Routes** (~15 routes)
   - `/api/assets` - GET, POST
   - `/api/assets/[id]` - GET, PATCH, DELETE
   - `/api/assets/[id]/download` - GET
   - `/api/assets/[id]/model` - GET
   - `/api/assets/[id]/thumbnail` - GET
   - `/api/assets/upload` - POST
   - `/api/assets/[id]/duplicate` - POST

2. **Generation Routes** (~10 routes)
   - `/api/generation` - POST
   - `/api/generation/status` - GET
   - `/api/ai/generate` - POST

3. **Audio Routes** (~8 routes)
   - `/api/audio/voice/generate` - POST
   - `/api/audio/sfx/generate` - POST
   - `/api/audio/music/generate` - POST
   - `/api/audio/file/[...path]` - GET
   - `/api/audio/voices` - GET

4. **Image Routes** (~6 routes)
   - `/api/images` - GET, POST
   - `/api/images/generate` - POST
   - `/api/images/file/[...path]` - GET
   - `/api/images/[id]` - GET, DELETE

5. **Content Routes** (~5 routes)
   - `/api/content/generate` - POST
   - `/api/content/dialogue` - POST
   - `/api/content/list` - GET

6. **Structure Routes** (~8 routes)
   - `/api/structures` - GET, POST, DELETE
   - `/api/structures/pieces` - GET, POST, DELETE
   - `/api/structures/pieces/generate` - POST
   - `/api/structures/buildings/generate` - POST
   - `/api/structures/bake` - POST
   - `/api/structures/towns` - GET, POST, DELETE

7. **VRM Routes** (~3 routes)
   - `/api/vrm/convert` - POST

8. **Armor Routes** (~4 routes)
   - `/api/armor/fit` - POST
   - `/api/armor/export` - POST

9. **Hand Rigging Routes** (~2 routes)
   - `/api/hand-rigging/simple` - POST

10. **World Routes** (~8 routes)
    - `/api/world/config` - GET, POST
    - `/api/world/entities` - GET, POST
    - `/api/world/entities/[id]` - GET, PUT, DELETE

11. **Game Routes** (~6 routes)
    - `/api/game/manifests` - GET
    - `/api/game/manifests/items` - GET
    - `/api/game/manifests/npcs` - GET
    - `/api/game/manifests/resources` - GET
    - `/api/game/manifests/areas` - GET
    - `/api/game/stores` - GET

12. **Import/Export Routes** (~4 routes)
    - `/api/import` - POST
    - `/api/import/manifests` - GET
    - `/api/export` - POST
    - `/api/export/promote` - POST

13. **Version Routes** (~4 routes)
    - `/api/versions` - GET, POST, PUT
    - `/api/versions/[id]` - GET, DELETE
    - `/api/versions/[id]/rollback` - POST

14. **Relationship Routes** (~3 routes)
    - `/api/relationships` - GET, POST, DELETE
    - `/api/relationships/search` - GET

15. **Settings Routes** (~6 routes)
    - `/api/settings/preferences` - GET, POST
    - `/api/settings/ai-gateway` - GET, POST
    - `/api/settings/ai-gateway/models` - GET
    - `/api/settings/balance` - GET
    - `/api/settings/elevenlabs` - GET, POST
    - `/api/settings/status` - GET

16. **Other Routes** (~10 routes)
    - `/api/sync` - GET, POST
    - `/api/templates/create` - POST
    - `/api/variants` - GET, POST
    - `/api/bulk/variants` - POST
    - `/api/sprites/generate` - POST
    - `/api/emotes` - GET
    - `/api/upload/image` - POST
    - `/api/upload/image/[filename]` - POST
    - `/api/meshy` - POST
    - `/api/agent` - GET, POST

### Phase 3: Missing Hooks (Priority 2)

**Hooks that need tests:**

1. `useAsyncOperation.ts` - ⚠️ **MISSING**
2. `useApi.ts` - ⚠️ **MISSING**
3. `useAssetBundle.ts` - ⚠️ **MISSING** (has test but verify completeness)
4. `useAssetRegistry.ts` - ⚠️ **MISSING**
5. `useGameManifests.ts` - ✅ Has test
6. `useGenerationForm.ts` - ✅ Has test
7. `useLiveServer.ts` - ✅ Has test
8. `useManifestSync.ts` - ✅ Has test
9. `useFetch.ts` - ✅ Has test
10. `useFullscreen.tsx` - ⚠️ **MISSING**
11. `usePane.tsx` - ⚠️ **MISSING**
12. `useUpdate.tsx` - ⚠️ **MISSING**

### Phase 4: Services (Priority 2)

**Services that need tests:**

1. **Fitting Services**
   - `ArmorFittingService.ts` - ⚠️ **MISSING**
   - `MeshFittingService.ts` - ⚠️ **MISSING**
   - `WeaponFittingService.ts` - ⚠️ **MISSING**
   - `WeightTransferService.ts` - ⚠️ **MISSING**

2. **VRM Services**
   - `VRMConverter.ts` - ✅ Has test
   - `BoneMappings.ts` - ⚠️ **MISSING**

3. **Hand Rigging Services**
   - `SimpleHandRiggingService.ts` - ✅ Has test
   - `HandRiggingService.ts` - ⚠️ **MISSING**
   - `HandPoseDetectionService.ts` - ⚠️ **MISSING**
   - `HandSegmentationService.ts` - ⚠️ **MISSING**
   - `OrthographicHandRenderer.ts` - ⚠️ **MISSING**

4. **Retargeting Services**
   - `AnimationRetargeter.ts` - ⚠️ **MISSING**
   - `AnimationRetargeting.ts` - ⚠️ **MISSING**
   - `AutoSkinSolver.ts` - ⚠️ **MISSING**
   - `DistanceSolver.ts` - ⚠️ **MISSING**
   - `DistanceChildTargetingSolver.ts` - ⚠️ **MISSING**
   - `WeightTransferSolver.ts` - ⚠️ **MISSING**
   - `SkeletonRetargeter.ts` - ⚠️ **MISSING**

5. **Processing Services**
   - `AssetNormalizationService.ts` - ✅ Has test
   - `WeaponHandleDetector.ts` - ⚠️ **MISSING**
   - `WeaponOrientationDetector.ts` - ⚠️ **MISSING**

6. **Generation Services**
   - `SpriteGenerationService.ts` - ✅ Has test

### Phase 5: E2E Tests (Priority 1)

**Critical user workflows:**

1. **Asset Generation Workflow**
   - Generate 3D model from text
   - Generate 3D model from image
   - View generated model
   - Export to game

2. **Asset Management Workflow**
   - Upload asset
   - View asset details
   - Edit asset properties
   - Delete asset
   - Duplicate asset

3. **World Editor Workflow**
   - Place entity on tile
   - Move entity
   - Delete entity
   - Save world config

4. **Content Generation Workflow**
   - Generate NPC
   - Generate quest
   - Generate dialogue tree
   - Export content

5. **Studio Workflows**
   - Armor fitting studio
   - Hand rigging studio
   - Structure studio

---

## Test Template Standards

### Component Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentName } from "../ComponentName";

describe("ComponentName", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  it("renders correctly", () => {
    render(<ComponentName {...props} />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const { user } = render(<ComponentName {...props} />);
    await user.click(screen.getByRole("button"));
    // Assert behavior
  });

  it("handles edge cases", () => {
    // Test edge cases
  });
});
```

### API Route Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";

describe("API Route: /api/example", () => {
  beforeEach(() => {
    // Setup mocks for external dependencies
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET returns correct data", async () => {
    const request = new NextRequest("http://localhost/api/example");
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toMatchObject({ success: true });
  });

  it("POST validates request body", async () => {
    const request = new NextRequest("http://localhost/api/example", {
      method: "POST",
      body: JSON.stringify({ invalid: "data" }),
    });
    const response = await POST(request, { params: Promise.resolve({}) });
    
    expect(response.status).toBe(400);
  });
});
```

### Hook Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useHookName } from "../useHookName";

describe("useHookName", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected initial state", () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty("expectedProperty");
  });

  it("handles state updates", async () => {
    const { result } = renderHook(() => useHookName());
    
    // Trigger update
    result.current.updateFunction();
    
    await waitFor(() => {
      expect(result.current.state).toBe("expected");
    });
  });
});
```

### Service Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceName } from "../ServiceName";

describe("ServiceName", () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
  });

  afterEach(() => {
    // Cleanup
  });

  it("initializes correctly", () => {
    expect(service).toBeInstanceOf(ServiceName);
  });

  it("performs operation correctly", async () => {
    const result = await service.operation();
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("handles errors gracefully", async () => {
    await expect(service.operationWithError()).rejects.toThrow();
  });
});
```

---

## Implementation Strategy

### Step 1: Create Test Infrastructure

1. **Test Utilities** (if needed)
   - Component render helpers
   - API request helpers
   - Three.js scene query helpers

2. **Test Data Fixtures**
   - Mock asset data
   - Mock API responses
   - Mock 3D models

### Step 2: Prioritize by Impact

1. **High-Impact Components** (used everywhere)
   - PropertiesPanel
   - ModelViewer
   - Generation forms

2. **Critical API Routes** (core functionality)
   - Asset CRUD
   - Generation endpoints
   - Storage endpoints

3. **User-Facing Features** (visible to users)
   - World editor
   - Dashboard
   - Vault

### Step 3: Batch Creation

Create tests in batches by category:
1. All generation forms (8 tests)
2. All properties panel components (12 tests)
3. All API routes in a domain (e.g., all asset routes)

### Step 4: Verify Coverage

After each batch:
1. Run coverage report
2. Verify all tests pass
3. Check for missing edge cases
4. Update this plan

---

## Progress Tracking

### Components (292 total, ~10 tested, ~282 remaining)

- [ ] Generation Forms (8)
- [ ] Properties Panel (12)
- [ ] Viewers (3)
- [ ] World Editor (4)
- [ ] Dashboard (12)
- [ ] Game Panels (15)
- [ ] Vault (3)
- [ ] UI Components (20)
- [ ] Others (205)

### API Routes (84 total, ~5 tested, ~79 remaining)

- [ ] Asset Routes (15)
- [ ] Generation Routes (10)
- [ ] Audio Routes (8)
- [ ] Image Routes (6)
- [ ] Content Routes (5)
- [ ] Structure Routes (8)
- [ ] VRM Routes (3)
- [ ] Armor Routes (4)
- [ ] Hand Rigging Routes (2)
- [ ] World Routes (8)
- [ ] Game Routes (6)
- [ ] Import/Export Routes (4)
- [ ] Version Routes (4)
- [ ] Relationship Routes (3)
- [ ] Settings Routes (6)
- [ ] Other Routes (10)

### Hooks (12 total, ~7 tested, ~5 remaining)

- [ ] `useAsyncOperation.ts`
- [ ] `useApi.ts`
- [ ] `useAssetBundle.ts` (verify completeness)
- [ ] `useAssetRegistry.ts`
- [ ] `useFullscreen.tsx`
- [ ] `usePane.tsx`
- [ ] `useUpdate.tsx`

### Services (~50 total, ~15 tested, ~35 remaining)

- [ ] Fitting Services (4)
- [ ] VRM Services (1)
- [ ] Hand Rigging Services (4)
- [ ] Retargeting Services (7)
- [ ] Processing Services (2)
- [ ] Others (17)

### E2E Tests (12 existing, need more)

- [ ] Asset Generation Workflow
- [ ] Asset Management Workflow
- [ ] World Editor Workflow
- [ ] Content Generation Workflow
- [ ] Studio Workflows (3)

---

## Next Steps

1. **Start with Critical Components**: Generation forms and PropertiesPanel
2. **Then API Routes**: Asset routes first (most used)
3. **Then Missing Hooks**: useAsyncOperation, useApi
4. **Then Services**: Fitting and rigging services
5. **Finally E2E**: Critical user workflows

---

**Last Updated**: 2025-01-24
**Target Completion**: 80%+ coverage across all categories
