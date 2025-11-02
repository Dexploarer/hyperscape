# Hyperscape Codebase Context for Kluster.ai

## Project Overview

**Hyperscape** is a real-time 3D multiplayer RPG engine with AI-generated content and autonomous AI agent integration. It's a heavily modified fork of Hyperfy, combining RuneScape-style gameplay mechanics with modern web technologies and AI capabilities.

**Key Characteristics:**
- Real multiplayer game engine (not a simulation/demo)
- Production-ready code with zero tolerance for mocks or incomplete implementations
- Strict TypeScript with no `any` types allowed
- Visual testing with real browser automation
- AI agents and humans play together in the same world

---

## Monorepo Structure

```
hyperscape/
├── packages/
│   ├── hyperscape/           # Core 3D engine
│   │   ├── src/
│   │   │   ├── core/        # ECS, networking, physics
│   │   │   ├── apps/        # .hyp application system
│   │   │   ├── scripting/   # JavaScript VM for apps
│   │   │   └── physics/     # PhysX integration
│   │   └── README.md
│   │
│   ├── rpg/                  # RuneScape-style RPG
│   │   ├── apps/
│   │   │   ├── Player.hyp   # Player character system
│   │   │   ├── RPGGoblin.hyp # AI-driven mob system
│   │   │   ├── Bank.hyp     # Banking system
│   │   │   └── Store.hyp    # Shop system
│   │   ├── world/           # World configuration
│   │   └── types.ts         # RPG-specific types
│   │
│   ├── generation/           # AI Content Generation
│   │   ├── src/
│   │   │   ├── gpt4/        # Text/lore generation
│   │   │   └── meshy/       # 3D model generation
│   │   └── README.md
│   │
│   ├── test-framework/       # Visual Testing System
│   │   ├── src/
│   │   │   ├── playwright/  # Browser automation
│   │   │   ├── visual/      # Screenshot analysis
│   │   │   └── utils/       # Test helpers
│   │   └── README.md
│   │
│   ├── plugin-hyperscape/    # ElizaOS AI Agent Plugin
│   │   ├── src/
│   │   │   ├── actions/     # Agent actions
│   │   │   ├── evaluators/  # Decision making
│   │   │   └── providers/   # World state providers
│   │   └── README.md
│   │
│   ├── client/               # Web Client (Vite + React)
│   ├── server/               # Game Server (Node.js)
│   └── shared/               # Shared types and utilities
│
├── apps/
│   ├── api/                  # REST API server
│   └── asset-forge/          # Asset creation tool
│
├── dev-books/                # Developer documentation
├── CLAUDE.md                 # Development rules & guidelines
├── LORE.md                   # Game world and lore
└── README.md                 # Main documentation
```

---

## Architecture Principles

### 1. Hyperscape Core Engine

**What it is:**
- Real-time 3D multiplayer engine built on Three.js and PhysX
- Entity Component System (ECS) architecture
- WebSocket-based networking with LiveKit integration
- .hyp application system (like mini-apps that run in the world)

**Key Systems:**
```typescript
// Entity Component System
class Entity {
  components: Map<string, Component>
  systems: System[]
  // All game objects are entities (players, mobs, items, etc.)
}

// Apps are isolated game logic modules
class HypApp {
  init(): void           // Called when app loads
  update(dt: number): void  // Called every frame
  destroy(): void        // Called on cleanup
}

// Networking synchronizes world state
class NetworkManager {
  broadcast(event: NetworkEvent): void
  send(clientId: string, event: NetworkEvent): void
}
```

**Important Constraints:**
- Hyperscape core should remain game-agnostic
- RPG logic stays in `packages/rpg/` as .hyp apps
- Use existing Hyperscape abstractions (don't reinvent)
- All multiplayer sync happens through NetworkManager

---

### 2. RPG Implementation

**What it is:**
- RuneScape-inspired MMORPG built ON TOP of Hyperscape
- Implemented entirely as .hyp apps (Player.hyp, RPGGoblin.hyp, etc.)
- Complete skill system (9 skills: combat + gathering + processing)
- Equipment, inventory, banking, and economy systems

**Core RPG Apps:**

```typescript
// Player.hyp - Player character with stats/inventory
export default class Player extends HypApp {
  // Stats: Attack, Strength, Defense, Constitution, Ranged, etc.
  // Inventory: 28 slots
  // Equipment: Weapon, armor, etc.
  // Skills: XP, levels, progression
}

// RPGGoblin.hyp - AI-driven mob with combat/loot
export default class RPGGoblin extends HypApp {
  // AI: Wander, aggro, attack, flee
  // Combat: Calculate damage, death, respawn
  // Loot: Drop table, item generation
}
```

**Data Separation:**
- Game data in JSON files, NOT hardcoded in TypeScript
- Mob definitions, item stats, loot tables all in external data
- Types defined in types.ts, data in separate files

---

### 3. Testing Philosophy

**The Hyperscape Way:**
- NO mocks, spies, or test framework abstractions
- Build "mini-worlds" for each feature test
- Use real Hyperscape instances with Playwright
- Multi-modal verification (data + visual)

**Testing Stack:**
```typescript
// 1. Three.js Testing - Check scene hierarchy
const playerMesh = scene.getObjectByName('player')
expect(playerMesh.position.x).toBeCloseTo(expectedX)

// 2. Visual Testing - Screenshot with colored proxies
await page.screenshot({ path: 'test-combat.png' })
const pixels = await analyzeScreenshot('test-combat.png')
expect(pixels.red).toBeGreaterThan(0) // Player present

// 3. ECS Testing - Introspect entity data
const player = world.getEntityById(playerId)
expect(player.getComponent('Health').current).toBe(80)

// 4. LLM Verification - GPT-4o image analysis
const analysis = await gpt4o.analyzeImage('test-combat.png')
expect(analysis.playerCount).toBe(1)
```

**Visual Proxies:**
- 🔴 Red = Players
- 🟢 Green = Goblins
- 🔵 Blue = Items
- 🟡 Yellow = Trees
- 🟣 Purple = Banks
- 🟨 Yellow-orange = Stores

---

### 4. AI Agent Integration (ElizaOS)

**What it is:**
- ElizaOS plugin that lets AI agents play the game
- Agents connect via WebSocket like human players
- All player actions available to AI (combat, gathering, movement, etc.)
- Agents make autonomous decisions based on world state

**Key Components:**
```typescript
// Actions - What AI can do
export const attackAction: Action = {
  name: 'ATTACK_MOB',
  async execute(params) {
    // AI agent attacks a mob
  }
}

// Evaluators - Decision making
export const combatEvaluator: Evaluator = {
  async evaluate(context) {
    // Should the AI engage in combat?
  }
}

// Providers - World state information
export const worldStateProvider: Provider = {
  async get(context) {
    // What can the AI see/know?
  }
}
```

---

## Technology Stack Deep Dive

### TypeScript Configuration

**Strict Mode Enabled:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

**Type Safety Rules:**
- NO `any` types ever
- NO `unknown` types
- Prefer classes over interfaces
- Explicit return types on public methods
- Use `value!` non-null assertions when guaranteed
- Import types with `import type { Type }`

---

### Three.js Usage Patterns

**Always Use Hyperscape Wrappers:**
```typescript
// ✅ CORRECT - Use Hyperscape abstractions
const entity = world.createEntity({
  components: {
    mesh: new MeshComponent(geometry, material),
    transform: new TransformComponent(position, rotation)
  }
})

// ❌ WRONG - Don't bypass Hyperscape
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh) // Skips ECS, networking, etc.
```

**Scene Hierarchy:**
```
Scene
├── World
│   ├── Entities (managed by ECS)
│   │   ├── Player entities
│   │   ├── Mob entities
│   │   └── Object entities
│   └── Environment
│       ├── Terrain
│       ├── Skybox
│       └── Lighting
```

---

### Database Patterns

**SQLite (Development) / PostgreSQL (Production):**
```typescript
// Use Drizzle ORM for type-safe queries
import { players, inventory } from './schema'

// ✅ Type-safe query
const playerData = await db
  .select()
  .from(players)
  .where(eq(players.id, playerId))

// ✅ Migrations for schema changes
export const migration_001 = sql`
  CREATE TABLE players (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`
```

**Performance Patterns:**
- Index frequently queried fields
- Batch operations for multiple updates
- Use transactions for related changes
- Optimize for real-time multiplayer (50-100 players)

---

### Networking & Multiplayer

**WebSocket Protocol:**
```typescript
// Client -> Server
{
  type: 'PLAYER_MOVE',
  data: { x: 10, y: 0, z: 5 }
}

// Server -> Clients (broadcast)
{
  type: 'ENTITY_UPDATE',
  data: {
    entityId: 'player-123',
    position: [10, 0, 5],
    rotation: [0, 1.5, 0]
  }
}
```

**State Synchronization:**
- Server is authoritative (validates all actions)
- Client predicts movement (smooth interpolation)
- Delta compression for bandwidth efficiency
- LiveKit for voice chat and WebRTC

---

## Common Patterns & Anti-Patterns

### ✅ CORRECT Patterns

**1. Type Definitions:**
```typescript
// Define types in types.ts
export class PlayerStats {
  attack: number
  strength: number
  defense: number
  constitution: number
}

// Use in implementation
import type { PlayerStats } from './types'

class Player {
  stats: PlayerStats

  getMaxHit(): number { // Explicit return type
    return Math.floor((this.stats.strength + 8) * 0.5)
  }
}
```

**2. Feature Modularity:**
```typescript
// Self-contained feature module
packages/rpg/apps/Fishing.hyp

export default class Fishing extends HypApp {
  // All fishing logic contained here
  // External data in fishing-spots.json
  // No dependencies on other RPG features
}
```

**3. Real Testing:**
```typescript
test('player can fish and gain XP', async () => {
  // Create real mini-world
  const world = await createTestWorld()
  const player = await world.spawnPlayer()
  const fishingSpot = await world.spawnFishingSpot()

  // Real interaction
  await player.click(fishingSpot)
  await waitForAnimation()

  // Multi-modal verification
  expect(player.inventory.has('raw_fish')).toBe(true) // Data
  const screenshot = await takeScreenshot()
  expect(screenshot.hasBluePixels()).toBe(true) // Visual (🔵 = item)
})
```

---

### ❌ WRONG Anti-Patterns

**1. Type Violations:**
```typescript
// ❌ NEVER DO THIS
function processData(data: any) { // any type
  return data.value as unknown as string // unknown cast
}

// ❌ NEVER DO THIS
if ('property' in object) { // Property check
  // Type narrowing via runtime check
}
```

**2. Hardcoded Data:**
```typescript
// ❌ NEVER DO THIS
const GOBLINS = [
  { name: 'Goblin', health: 10, attack: 5 },
  { name: 'Big Goblin', health: 20, attack: 8 }
] // Hardcoded in source
```

**3. Mock Testing:**
```typescript
// ❌ NEVER DO THIS
const mockPlayer = {
  attack: jest.fn(),
  getHealth: jest.fn(() => 100)
}

test('combat works', () => {
  mockPlayer.attack()
  expect(mockPlayer.attack).toHaveBeenCalled()
})
```

---

## File Organization Conventions

### Package Structure
```
packages/[package-name]/
├── src/
│   ├── types.ts          # Type definitions
│   ├── index.ts          # Public exports
│   ├── core/             # Core functionality
│   ├── utils/            # Utilities
│   └── __tests__/        # Tests
├── package.json
├── tsconfig.json
└── README.md
```

### Import Patterns
```typescript
// ✅ Type imports
import type { Player, Mob } from './types'

// ✅ Workspace imports
import { World } from '@hyperscape/core'
import { PlayerStats } from '@hyperscape/rpg'

// ❌ Don't use relative paths across packages
import { World } from '../../../hyperscape/src/core/World' // WRONG
```

---

## Environment & Configuration

### Environment Variables
```bash
# Root .env file
DATABASE_URL=postgresql://localhost/hyperscape
OPENAI_API_KEY=sk-...
MESHY_API_KEY=msy_...
LIVEKIT_URL=wss://...
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...
```

### Package Configuration
```json
// package.json workspace setup
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

---

## API Surface Area

### REST API Endpoints
```
GET  /api/state                          # Available state queries
GET  /api/state/player-stats?playerId=   # Player information
POST /api/actions/attack                 # Execute player actions
GET  /api/actions/available?playerId=    # Available actions
```

### WebSocket Events
```typescript
// Client -> Server
'player:move'       // Movement request
'player:attack'     // Attack action
'player:interact'   // Interact with object
'chat:message'      // Chat message

// Server -> Client
'entity:update'     // Entity state change
'player:joined'     // Player connected
'player:left'       // Player disconnected
'world:update'      // World state change
```

---

## Performance Considerations

### Optimization Targets
- **Players:** 50-100 concurrent players per server
- **Entities:** 1000+ entities in world
- **Frame Rate:** 60 FPS minimum on client
- **Network:** <100ms latency for actions
- **Memory:** 4GB+ recommended for server

### Known Performance Patterns
```typescript
// ✅ Efficient - Object pooling
const meshPool = new ObjectPool(() => new THREE.Mesh())
const mesh = meshPool.acquire()

// ✅ Efficient - Batch updates
world.batchUpdate(entities, (entity) => {
  entity.update(dt)
})

// ❌ Inefficient - Creating in loop
for (let i = 0; i < 1000; i++) {
  const mesh = new THREE.Mesh() // Creates garbage
}
```

---

## Security Model

### Authentication Flow
1. Client authenticates with Privy (social/wallet/email)
2. Privy returns JWT token
3. Client sends JWT to game server
4. Server validates JWT with Privy
5. Server creates game session
6. Client receives session ID for WebSocket

### Authorization Checks
```typescript
// Server validates all player actions
async function handlePlayerAction(playerId: string, action: Action) {
  // 1. Verify player session
  const session = await validateSession(playerId)

  // 2. Check player permissions
  if (!canPlayerPerformAction(playerId, action)) {
    throw new UnauthorizedError()
  }

  // 3. Execute action
  await executeAction(playerId, action)
}
```

---

## Common Code Review Scenarios

### Scenario 1: Adding New RPG Feature
```typescript
// Example: Adding cooking skill

// ✅ CORRECT Implementation:
// 1. Create Cooking.hyp app in packages/rpg/apps/
// 2. Define types in packages/rpg/types.ts
// 3. Store recipe data in cooking-recipes.json
// 4. Create real tests in __tests__/cooking.test.ts
// 5. Use existing Hyperscape systems (ECS, networking)

// ❌ WRONG Implementation:
// 1. Hardcode recipes in TypeScript ❌
// 2. Use any types ❌
// 3. Mock tests ❌
// 4. Bypass Hyperscape networking ❌
```

### Scenario 2: Database Schema Change
```typescript
// ✅ CORRECT:
// 1. Create migration file
export const migration_005 = sql`
  ALTER TABLE players ADD COLUMN cooking_level INTEGER DEFAULT 1
`

// 2. Update Drizzle schema
export const players = pgTable('players', {
  id: text('id').primaryKey(),
  cookingLevel: integer('cooking_level').notNull().default(1)
})

// 3. Update TypeScript types
export class PlayerSkills {
  cooking: number
}

// ❌ WRONG:
// 1. Manually ALTER database without migration ❌
// 2. Schema and types don't match ❌
```

### Scenario 3: Adding API Endpoint
```typescript
// ✅ CORRECT:
app.get('/api/state/cooking-level', async (req, res) => {
  const { playerId } = req.query

  // Validate input
  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'Invalid playerId' })
  }

  // Check authentication
  const session = await validateSession(req.headers.authorization!)
  if (session.playerId !== playerId) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  // Fetch data
  const player = await db.query.players.findFirst({
    where: eq(players.id, playerId)
  })

  res.json({ cookingLevel: player!.cookingLevel })
})

// ❌ WRONG:
// - Missing input validation ❌
// - No authentication check ❌
// - No error handling ❌
// - Using 'any' types ❌
```

---

## Quick Reference

### File Extensions
- `.ts` - TypeScript source
- `.tsx` - TypeScript with JSX (React)
- `.hyp` - Hyperscape application (TypeScript)
- `.test.ts` - Test files
- `.json` - Data files (loot tables, configs, etc.)

### Common Commands
```bash
npm install           # Install dependencies
npm run build         # Build all packages
npm start             # Start game server
npm test              # Run all tests
npm run lint          # Lint code
npm run dev           # Development mode
```

### Key Directories
- `/packages/hyperscape/src/core/` - Engine core
- `/packages/rpg/apps/` - RPG .hyp applications
- `/packages/test-framework/src/` - Testing utilities
- `/packages/plugin-hyperscape/src/` - AI agent plugin
- `/logs/` - Test error logs
- `/dev-books/` - Developer documentation

---

## External Dependencies

### Primary Libraries
- `three` - 3D rendering (Three.js r162+)
- `@dimforge/rapier3d` - Physics (PhysX alternative)
- `playwright` - Browser automation for testing
- `drizzle-orm` - Type-safe database ORM
- `ws` - WebSocket server/client
- `@elizaos/core` - AI agent framework
- `openai` - GPT-4 for content generation
- `@privy-io/react-auth` - Authentication

### Version Compatibility
- Node.js: 20+
- TypeScript: 5.3+
- React: 18+
- Three.js: r162+

---

**Last Updated:** 2025-11-02
**For Questions:** See CLAUDE.md or README.md
