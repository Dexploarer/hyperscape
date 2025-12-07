# Admin Panel: Master Integration Plan

> [!IMPORTANT] > **Source of Truth**: This document is the absolute authority for the Admin Panel implementation.
> **Scope Strictness**: Any deviation from this plan requires a formal update to this document.
> **Tech Stack**: Next.js 15, React 19, Tailwind 4.0, @xyflow/react (v12). See `docs/TECH_STACK.md` for API laws.
> **Design System**: See `docs/DESIGN_SYSTEM.md` for the strict Component Library & Token definitions.

---

## 1. Project Mandate

**Why are we building this?**
To replace manual, error-prone JSON editing with a "Spectacular" Visual Command Center. The intended outcome is a proprietary Game Engine tool that allows developers and admins to modify the world (`manifests`), control game mechanics (global config), and monitor server health without touching raw code or database rows/files.

**Core Objectives**:

1.  **Visual Manifest Editing**: Node-based graph editor for Areas and Entities.
2.  **Global Logic Control**: Real-time sliders for Water Level and Drop Rates.
3.  **Zero-Restart Workflow**: Hot Reloading of manifests via Server API.
4.  **"Void Glass" Aesthetic**: Premium, cinematic UI that feels like a sci-fi cockpit.

---

## 2. Global Rules & Constraints

1.  **Atomic Execution**: Do not proceed to Phase N+1 until Phase N verification passes.
2.  **Context Preservation**: Before every code change, read `src/lib/manifests/schemas.ts` to ensure type safety.
3.  **No Magic Strings**: All manifest keys (`"waterLevel"`) and config keys (`"dropRateMultiplier"`) must be defined as constants in a shared definitions file.
4.  **Async-First**: All File I/O and DB operations must use `async/await` and Next.js 15 Server Actions patterns.
5.  **Validation-First**: Zod schemas are the gatekeepers. No data is written to disk without passing schema validation.
6.  **Component-First**: **NEVER** build a UI inline. Always check `docs/DESIGN_SYSTEM.md`. If a component is missing, create it in `src/components/ui/` first, then use it.

---

## 3. Atomic Execution Plan

### Phase 1: Foundation & The "Void Glass" Design System

**Goal**: Initialize the application and build the complete reusable component library.
**Why**: To ensure "clean reusable uniform code" from line one.

1.  **Init Package**: `npx create-next-app@latest packages/admin-panel` (TS, Tailwind, ESLint, App Router).
2.  **Token System**: Configure `app/globals.css` with `@theme` (Tailwind 4). Define Colors (`void`, `glass`, `neon`), Shadws, and Typography.
3.  **Core Atoms (The "LEGO Bricks")**:
    - `Button`: Variants (Solid, Glass, Outline, Ghost).
    - `Input` / `Textarea`: Glass backgrounds, neon focus states.
    - `Slider`: Custom track and thumb for Water Level/Config.
    - `Badge`: Status indicators (Green/Red/Amber dots).
    - `Switch` / `Checkbox`: For boolean toggles.
    - `Card`: The fundamental glass container.
4.  **Molecules (Composite UI)**:
    - `Modal`: Framer Motion animated dialogs.
    - `Toast`: Status notifications.
    - `StatCard`: For dashboard metrics.
    - `Breadcrumb`: Navigation path.
5.  **Layout Implementation**:
    - `src/components/layout/Sidebar.tsx`: Collapsible, icon-only mode.
    - `src/components/layout/AdminShell.tsx`: The main wrapper.

> [!TIP] > **Sanity Check**: Create a `/design` route that displays every single component in a grid (Kitchen Sink). Verify all hover states, animations, and dark mode contrast.

### Phase 2: The Manifest Engine (The Brain)

**Goal**: Create the secure I/O layer for `biomes.json`, `world-areas.json`, and `npcs.json`.
**Why**: We need a safe way to read/write files without corrupting the game data.

1.  **Zod Schemas**: Create `src/lib/manifests/schemas.ts`. Mirror the server types exactly.
2.  **Server Actions**: Create `src/lib/actions/manifest-actions.ts`.
    - `readManifest(type: ManifestType)`: `fs.readFile` -> JSON.parse -> Schema.parse.
    - `writeManifest(type, data)`: Schema.parse -> `fs.writeFile` (2-space indent).
    - `listBackups(type)`: List files in `manifests/backups/`.
3.  **Raw Editor**: Implement `app/manifests/[type]/page.tsx` using `Textarea` atom.

> [!TIP] > **Sanity Check**: Use the Raw Editor to change a Biome Name. Save. Verify the file on disk changed.

### Phase 3: Visual World Editor (The Face)

**Goal**: The Node Graph implementation using `@xyflow/react`.
**Why**: Humans are bad at visualizing coordinates in JSON. Nodes make it intuitive.

1.  **Canvas Components**:
    - `WorldCanvas`: Wrapper around `ReactFlow`.
    - `CanvasControls`: Custom zoom/pan buttons (using `Button` atom).
    - `MiniMap`: Styled to match "Void Glass".
2.  **Custom Nodes**:
    - `AreaNode`: Uses `Card` atom logic but resizable.
    - `EntityNode`: Uses `Badge` atom logic but draggable.
3.  **Node Toolbar**: Floating glass panel with `Button` atoms for adding nodes.

> [!TIP] > **Sanity Check**: Open World Editor. Drag "Central Haven". Switch tabs. Return. Verify position persisted in State.

### Phase 4: Global Logic & Server Configuration

**Goal**: Real-time control over Game Rules.
**Why**: Admins need to adjust drop rates/difficulty without restarting.

1.  **Configuration Interface**:
    - `WaterLevelControl`: Uses `Slider` atom (Vertical).
    - `ConfigForm`: Uses `Input` (Number) and `Switch` atoms.
2.  **Integration**:
    - Connect to PostgreSQL `config` table via `src/lib/db.ts`.

> [!TIP] > **Sanity Check**: Set Drop Rate to 5x. Check DB table `config`. Row `drop_rate_multiplier` should be `5`.

### Phase 5: Zero-Restart Integration (Hot Reload)

**Goal**: Make changes live instantly.
**Why**: Restarting the server takes 10s+ and disconnects players.

1.  **Server Endpoint**: Add `POST /api/admin/reload` to `packages/server`.
    - Middleware: Validate `x-admin-code` header.
    - Logic: Flush `ManifestCache`, re-read JSONs.
2.  **Admin Trigger**: Add "Deploy Changes" `Button` to Admin Action Bar.
    - On Click: `saveManifests()` -> `await fetch('/api/admin/reload')`.

> [!TIP] > **Sanity Check**: Move an NPC. Click Deploy. Log into Game Client. Verify NPC moved immediately.

---

## 4. Knowledge Base & Context

### Tech Stack Refresher

- **Next.js 15**: Use `await params`. No `useEffect` for data fetching (use Server Components or `use(Promise)`).
- **React 19**: Use `useActionState` for all form mutations.
- **xyflow**: Use `node.measured.width` for dimensions.

### File Systems

- **Manifests**: `packages/server/world/assets/manifests/*.json`
- **Assets**: `packages/server/world/assets/` (served via CDN)

### Security

- **Admin Code**: A shared secret string in `.env` (`ADMIN_CODE`). Must be sent with every mutation request to the Game Server.

---

## 5. Scope Control Checklist

- [ ] Is this feature in the Master Plan? If no, **REJECT**.
- [ ] Does this require a new dependency? If yes, **VALIDATE**.
- [ ] Does this break existing Server Types? If yes, **ABORT** and refactor Server first.
- [ ] Is there an existing Component for this? If yes, **REUSE**.
