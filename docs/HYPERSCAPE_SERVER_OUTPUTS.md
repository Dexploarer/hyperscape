# Hyperscape Server Outputs Reference

> A comprehensive reference for all server outputs that can be used to integrate with ElizaOS agent plugins.

## Table of Contents

1. [WebSocket Messages (Server → Client)](#websocket-messages-server--client)
2. [World Events (EventType)](#world-events-eventtype)
3. [REST API Endpoints](#rest-api-endpoints)
4. [Client Input Messages (Client → Server)](#client-input-messages-client--server)
5. [ElizaOS Integration Patterns](#elizaos-integration-patterns)

---

## WebSocket Messages (Server → Client)

These are network messages sent from the Hyperscape server to connected clients via WebSocket.

### Connection & Authentication

| Message Name | Payload | Description | File Location |
|-------------|---------|-------------|---------------|
| `snapshot` | `{ id, serverTime, assetsUrl, apiUrl, settings, chat, entities, livekit, authToken, account, characters }` | Initial world state sent on connection | `connection-handler.ts:338-360` |
| `kick` | `"player_limit"` | Player kicked (server full) | `connection-handler.ts:168` |
| `characterList` | `{ characters: [{ id, name }] }` | List of characters for account | `character-selection.ts:71` |
| `characterCreated` | `{ id, name }` | New character created successfully | `character-selection.ts:175` |
| `characterSelected` | `{ characterId }` | Character selection confirmed | `character-selection.ts:195-197` |
| `showToast` | `{ message, type: "error" \| "success" }` | UI notification/toast | `character-selection.ts:118` |

### Entity Management

| Message Name | Payload | Description | File Location |
|-------------|---------|-------------|---------------|
| `entityAdded` | `{ id, type, position, quaternion, name, health, ... }` | New entity spawned in world | `connection-handler.ts:444-448` |
| `entityModified` | `{ id, changes: { p?, q?, v?, e?, name?, roles?, ... } }` | Entity state changed | `movement.ts:80-88, 142-150` |
| `entityRemoved` | `entityId (string)` | Entity removed from world | `socket-management.ts:144` |
| `resourceSnapshot` | `{ resources: [{ id, type, position, isAvailable, respawnAt }] }` | All resource states on connect | `connection-handler.ts:406-418` |

### Player State

| Message Name | Payload | Description | File Location |
|-------------|---------|-------------|---------------|
| `playerState` | `{ playerId, ... }` | Player-specific UI state | `event-bridge.ts:203-209` |
| `playerUpdated` | `{ health, maxHealth, alive }` | Player stats changed | `event-bridge.ts:369-373` |
| `playerSetDead` | `{ playerId, isDead }` | Player death state changed | `event-bridge.ts:242-250` |
| `playerRespawned` | `{ playerId, spawnPosition }` | Player respawned at position | `event-bridge.ts:254-262` |
| `deathScreen` | `{ playerId, message, killedBy, respawnTime }` | Show death UI | `event-bridge.ts:213-226` |
| `deathScreenClose` | `{ playerId }` | Hide death UI | `event-bridge.ts:230-238` |

### Inventory & Equipment

| Message Name | Payload | Description | File Location |
|-------------|---------|-------------|---------------|
| `inventoryUpdated` | `{ playerId, items: [{ slot, itemId, quantity, item }], coins, maxSlots }` | Full inventory state | `event-bridge.ts:100-118` |
| `equipmentUpdated` | `{ playerId, equipment: { [slotType]: { item, itemId } } }` | Equipment state | `character-selection.ts:527-530` |

### Combat

| Message Name | Payload | Description | File Location |
|-------------|---------|-------------|---------------|
| `combatDamageDealt` | `{ attackerId, targetId, damage, targetType, position }` | Damage dealt (for splats) | `event-bridge.ts:319-333` |
| `attackStyleChanged` | `{ playerId, currentStyle, availableStyles, canChange, cooldownRemaining? }` | Attack style changed | `event-bridge.ts:266-284` |
| `attackStyleUpdate` | `{ playerId, currentStyle, availableStyles, canChange }` | Attack style update | `event-bridge.ts:288-301` |

### Skills

| Message Name | Payload | Description | File Location |
|-------------|---------|-------------|---------------|
| `skillsUpdated` | `{ playerId, skills: { [skillName]: { level, xp } } }` | Skills changed | `event-bridge.ts:173-182` |

### Resources

| Message Name | Payload | Description | File Location |
|-------------|---------|-------------|---------------|
| `resourceDepleted` | `{ resourceId, ... }` | Resource depleted | `event-bridge.ts:66-68` |
| `resourceRespawned` | `{ resourceId, ... }` | Resource respawned | `event-bridge.ts:70-72` |
| `resourceSpawned` | `{ resourceId, type, position, ... }` | New resource spawned | `event-bridge.ts:74-76` |
| `resourceSpawnPoints` | `[{ id, type, position }]` | All spawn points registered | `event-bridge.ts:78-83` |

### Chat

| Message Name | Payload | Description | File Location |
|-------------|---------|-------------|---------------|
| `chatAdded` | `{ id, from, fromId, body, createdAt }` | Chat message broadcast | `handlers/chat.ts:21` |

---

## World Events (EventType)

These are internal events emitted on the `World` instance. ElizaOS plugins can subscribe to these via `world.on(EventType.X, handler)`.

### Player Events

```typescript
// Player Lifecycle
PLAYER_JOINED        = "player:joined"        // { playerId, player }
PLAYER_LEFT          = "player:left"          // { playerId }
PLAYER_LOGOUT        = "player:logout"        // { playerId }
PLAYER_RECONNECTED   = "player:reconnected"   // { playerId }
PLAYER_SPAWNED       = "player:spawned"       // { playerId, position }
PLAYER_UPDATED       = "player:updated"       // { playerId, playerData }
PLAYER_DIED          = "player:died"          // { playerId }
PLAYER_RESPAWNED     = "player:respawned"     // { playerId, spawnPosition }
PLAYER_SET_DEAD      = "player:set_dead"      // { playerId, isDead }

// Player Stats
PLAYER_LEVEL_UP      = "player:level_up"      // { playerId, skill, newLevel }
PLAYER_XP_GAINED     = "player:xp_gained"     // { playerId, skill, xp }
PLAYER_HEALTH_UPDATED = "player:health_updated" // { playerId, health, maxHealth }
PLAYER_DAMAGE        = "player:damage"        // { playerId, damage, source }

// Player Movement
PLAYER_TELEPORTED    = "player:teleported"    // { playerId, position }
PLAYER_POSITION_UPDATED = "player:position:updated" // { playerId, position }

// Player Equipment
PLAYER_EQUIPMENT_CHANGED = "player:equipment_changed"  // { playerId, slot, item }
ATTACK_STYLE_CHANGED = "attack_style:changed" // { playerId, newStyle }
```

### Combat Events

```typescript
COMBAT_STARTED       = "combat:started"       // { attackerId, targetId }
COMBAT_ENDED         = "combat:ended"         // { attackerId, targetId }
COMBAT_ATTACK_REQUEST = "combat:attack_request" // { playerId, targetId, attackerType, targetType, attackType }
COMBAT_DAMAGE_DEALT  = "combat:damage_dealt"  // { attackerId, targetId, damage, targetType, position }
COMBAT_DAMAGE_CALCULATE = "combat:damage_calculate" // { attackerId, targetId, baseDamage }
COMBAT_MISS          = "combat:miss"          // { attackerId, targetId }
COMBAT_KILL          = "combat:kill"          // { attackerId, targetId }
COMBAT_HEAL          = "combat:heal"          // { targetId, amount }
```

### Inventory Events

```typescript
INVENTORY_INITIALIZED = "inventory:initialized" // { playerId, inventory }
INVENTORY_UPDATED    = "inventory:updated"    // { playerId, items, coins }
INVENTORY_REQUEST    = "inventory:request"    // { playerId }
INVENTORY_FULL       = "inventory:full"       // { playerId }
INVENTORY_ITEM_ADDED = "inventory:item_added" // { playerId, itemId, quantity }
INVENTORY_ITEM_REMOVED = "inventory:item_removed" // { playerId, itemId, quantity }

// Item Actions
ITEM_PICKUP          = "item:picked_up"       // { playerId, entityId, itemId }
ITEM_DROP            = "item:drop"            // { playerId, itemId, quantity, slot }
ITEM_SPAWNED         = "item:spawned"         // { entityId, itemId, position }
ITEM_DESPAWNED       = "item:despawned"       // { entityId }
INVENTORY_ITEM_RIGHT_CLICK = "inventory:item_right_click" // { playerId, itemId, slot }
```

### Equipment Events

```typescript
EQUIPMENT_EQUIP      = "equipment:equip"      // { playerId, itemId, slot }
EQUIPMENT_UNEQUIP    = "equipment:unequip"    // { playerId, slot }
EQUIPMENT_EQUIPPED   = "equipment:equipped"   // { playerId, itemId, slot }
EQUIPMENT_UNEQUIPPED = "equipment:unequipped" // { playerId, slot, item }
```

### Resource Events

```typescript
RESOURCE_SPAWNED     = "resource:spawned"     // { resourceId, type, position }
RESOURCE_GATHER      = "resource:gather"      // { playerId, resourceId, playerPosition }
RESOURCE_GATHERED    = "resource:gathered"    // { playerId, resourceId, itemId, xpGained }
RESOURCE_DEPLETED    = "resource:depleted"    // { resourceId }
RESOURCE_RESPAWNED   = "resource:respawned"   // { resourceId }
RESOURCE_SPAWN_POINTS_REGISTERED = "resource:spawn_points:registered" // [{ id, type, position }]
```

### Skills Events

```typescript
SKILLS_XP_GAINED     = "skills:xp_gained"     // { playerId, skill, xp }
SKILLS_LEVEL_UP      = "skills:level_up"      // { playerId, skill, newLevel }
SKILLS_UPDATED       = "skills:updated"       // { playerId, skills }
SKILLS_MILESTONE     = "skills:milestone"     // { playerId, skill, milestone }
TOTAL_LEVEL_CHANGED  = "total:level:changed"  // { playerId, totalLevel }
```

### Mob/NPC Events

```typescript
MOB_NPC_SPAWNED      = "mob_npc:spawned"      // { entityId, type, position }
MOB_NPC_DESPAWNED    = "mob_npc:despawned"    // { entityId }
MOB_NPC_DAMAGED      = "mob_npc:damaged"      // { entityId, damage, attacker }
MOB_NPC_ATTACKED     = "mob_npc:attacked"     // { entityId, attackerId }
NPC_DIED             = "npc:died"             // { entityId, killerId }
MOB_NPC_AGGRO        = "mob_npc:aggro"        // { entityId, playerId }
```

### Store/Bank Events

```typescript
STORE_OPEN           = "store:open"           // { playerId, storeId }
STORE_BUY            = "store:buy"            // { playerId, itemId, quantity }
STORE_SELL           = "store:sell"           // { playerId, itemId, quantity }
BANK_OPEN            = "bank:open"            // { playerId }
BANK_DEPOSIT         = "bank:deposit"         // { playerId, itemId, quantity }
BANK_WITHDRAW        = "bank:withdraw"        // { playerId, itemId, quantity }
```

### UI Events

```typescript
UI_UPDATE            = "ui"                   // { component, data }
UI_DEATH_SCREEN      = "ui:death_screen"      // { playerId, message, killedBy, respawnTime }
UI_DEATH_SCREEN_CLOSE = "ui:death_screen:close" // { playerId }
UI_ATTACK_STYLE_CHANGED = "ui:attack_style:changed" // { playerId, currentStyle, availableStyles, canChange }
UI_ATTACK_STYLE_UPDATE = "ui:attack_style:update" // { playerId, currentStyle, availableStyles, canChange }
UI_TOAST             = "ui:toast"             // { message, type }
```

### Chat Events

```typescript
CHAT_MESSAGE         = "chat:message"         // { from, fromId, body, createdAt }
CHAT_SEND            = "chat:send"            // { playerId, message }
```

### Character Events

```typescript
CHARACTER_LIST       = "character:list"       // { accountId, characters }
CHARACTER_CREATED    = "character:created"    // { characterId, name }
CHARACTER_SELECTED   = "character:selected"   // { characterId }
```

---

## REST API Endpoints

### Health & Status

| Endpoint | Method | Response | Description |
|----------|--------|----------|-------------|
| `/health` | GET | `{ status: "ok", timestamp, uptime }` | Basic health check |
| `/status` | GET | `{ uptime, protected, connectedUsers: [{ id, position, name }], commitHash }` | Server status with connected players |

### Actions API

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/actions` | GET | - | `{ success, actions: [{ name, description, parameters }] }` | List all registered actions |
| `/api/actions/available` | GET | `?playerId=xxx` | `{ success, actions: ["action1", "action2"] }` | Actions available for context |
| `/api/actions/:name` | POST | `{ params: {...} }` | `{ success, result }` | Execute an action |

### Player Management

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/player/disconnect` | POST | `{ playerId }` | `{ success }` | Force disconnect player |

### File Upload

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/upload` | POST | multipart/form-data | `{ url }` | Upload file |
| `/api/upload-check` | GET | - | `{ enabled, maxSize }` | Check upload capabilities |

### Error Reporting

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/errors/frontend` | POST | `{ error, stack, context }` | `{ received: true }` | Report frontend errors |

---

## Client Input Messages (Client → Server)

These are messages sent from clients that the server handles.

### Movement

| Handler Name | Payload | Description |
|-------------|---------|-------------|
| `onMoveRequest` | `{ target: [x, y, z], runMode?: boolean, cancel?: boolean }` | Click-to-move request |
| `onInput` | `{ type: "click", target: [x, y, z], runMode?: boolean }` | Legacy input handling |

### Combat

| Handler Name | Payload | Description |
|-------------|---------|-------------|
| `onAttackMob` | `{ mobId, attackType? }` | Attack a mob |
| `onChangeAttackStyle` | `{ newStyle }` | Change attack style |

### Inventory

| Handler Name | Payload | Description |
|-------------|---------|-------------|
| `onPickupItem` | `{ itemId (entityId) }` | Pick up item from ground |
| `onDropItem` | `{ itemId, slot?, quantity? }` | Drop item from inventory |
| `onEquipItem` | `{ itemId, inventorySlot? }` | Equip item |
| `onUnequipItem` | `{ slot }` | Unequip item |

### Resources

| Handler Name | Payload | Description |
|-------------|---------|-------------|
| `onResourceGather` | `{ resourceId, playerPosition? }` | Gather a resource |

### Character

| Handler Name | Payload | Description |
|-------------|---------|-------------|
| `onCharacterListRequest` | - | Request character list |
| `onCharacterCreate` | `{ name }` | Create new character |
| `onCharacterSelected` | `{ characterId }` | Select character |
| `onEnterWorld` | `{ characterId }` | Enter world with character |

### Entities

| Handler Name | Payload | Description |
|-------------|---------|-------------|
| `onEntityModified` | `{ id, changes: {...} }` | Modify entity (cosmetic only for players) |
| `onEntityEvent` | `{ id?, name/event, data/payload }` | Generic entity event |

### Chat & Commands

| Handler Name | Payload | Description |
|-------------|---------|-------------|
| `onChatAdded` | `{ from, fromId, body, createdAt }` | Send chat message |
| `onCommand` | `[cmd, arg1, arg2, ...]` | Execute slash command |

### Death/Respawn

| Handler Name | Payload | Description |
|-------------|---------|-------------|
| `onRequestRespawn` | - | Request respawn after death |

---

## ElizaOS Integration Patterns

### Provider Pattern - Reading Server State

Create a provider that reads Hyperscape world state for agent context:

```typescript
import type { Provider, IAgentRuntime, Memory } from '@elizaos/core';
import { World, EventType } from '@hyperscape/shared';

export const hyperscapeStateProvider: Provider = {
  name: 'HYPERSCAPE_STATE',
  description: 'Provides current Hyperscape game state',
  dynamic: true,

  get: async (runtime: IAgentRuntime, message: Memory) => {
    const world = runtime.getService<World>('hyperscape');
    if (!world) return { text: '', data: {} };

    // Collect player data
    const players: any[] = [];
    world.entities.items.forEach((entity, id) => {
      if (entity.type === 'player') {
        players.push({
          id,
          name: entity.data.name,
          position: entity.position,
          health: entity.data.health,
          level: entity.data.level,
        });
      }
    });

    return {
      text: `Current players: ${players.map(p => p.name).join(', ')}`,
      data: {
        playerCount: players.length,
        players,
        worldTime: world.time,
      },
    };
  }
};
```

### Action Pattern - Executing Game Commands

Create an action that can affect the Hyperscape world:

```typescript
import type { Action, IAgentRuntime, Memory } from '@elizaos/core';
import { World, EventType } from '@hyperscape/shared';

export const spawnItemAction: Action = {
  name: 'SPAWN_ITEM',
  description: 'Spawn an item in the game world',

  validate: async (runtime, message) => {
    return message.content.text.includes('spawn') &&
           message.content.text.includes('item');
  },

  handler: async (runtime, message) => {
    const world = runtime.getService<World>('hyperscape');
    if (!world) {
      return { success: false, error: 'Hyperscape not connected' };
    }

    // Parse item from message
    const itemId = extractItemId(message.content.text);
    const position = extractPosition(message.content.text);

    // Emit spawn event
    world.emit(EventType.ITEM_SPAWN_REQUEST, {
      itemId,
      position,
    });

    return {
      success: true,
      text: `Spawned ${itemId} at position ${position}`,
    };
  }
};
```

### Event Listener Pattern - Reacting to Game Events

Subscribe to world events to trigger agent behaviors:

```typescript
import { Service, IAgentRuntime } from '@elizaos/core';
import { World, EventType } from '@hyperscape/shared';

export class HyperscapeEventService extends Service {
  static serviceType = 'hyperscape-events';
  capabilityDescription = 'Listens to Hyperscape game events';

  private world!: World;
  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();

  static async start(runtime: IAgentRuntime): Promise<HyperscapeEventService> {
    const service = new HyperscapeEventService(runtime);
    await service.initialize();
    return service;
  }

  private async initialize(): Promise<void> {
    this.world = this.runtime.getService<World>('hyperscape')!;

    const onPlayerJoined = async (payload: { playerId: string, player: any }) => {
      const { player } = payload;
      console.log(`Player ${player.data.name} joined!`);
      // Trigger agent greeting or action
    };
    this.world.on(EventType.PLAYER_JOINED, onPlayerJoined);
    this.eventHandlers.set(EventType.PLAYER_JOINED, onPlayerJoined);

    const onCombatKill = async (payload: { attackerId: string, targetId: string }) => {
      // Log or react to kills
    };
    this.world.on(EventType.COMBAT_KILL, onCombatKill);
    this.eventHandlers.set(EventType.COMBAT_KILL, onCombatKill);

    const onSkillsLevelUp = async (payload: { playerId: string, skill: string, newLevel: number }) => {
      // Congratulate player or adjust difficulty
    };
    this.world.on(EventType.SKILLS_LEVEL_UP, onSkillsLevelUp);
    this.eventHandlers.set(EventType.SKILLS_LEVEL_UP, onSkillsLevelUp);

    const onPlayerDied = async (payload: { playerId: string }) => {
      // Offer assistance or commentary
    };
    this.world.on(EventType.PLAYER_DIED, onPlayerDied);
    this.eventHandlers.set(EventType.PLAYER_DIED, onPlayerDied);

    const onChatMessage = async (payload: { from: string, body: string }) => {
      // Process chat for agent responses
    };
    this.world.on(EventType.CHAT_MESSAGE, onChatMessage);
    this.eventHandlers.set(EventType.CHAT_MESSAGE, onChatMessage);
  }

  async stop(): Promise<void> {
    // Cleanup listeners
    this.eventHandlers.forEach((handler, event) => {
      this.world.off(event, handler);
    });
    this.eventHandlers.clear();
  }
}
```

### Message Broadcasting Pattern

Send messages to players from the agent:

```typescript
import { BroadcastManager } from './systems/ServerNetwork/broadcast';

export function sendAgentMessage(
  broadcast: BroadcastManager,
  playerId: string,
  message: string
): void {
  // Send to specific player
  broadcast.sendToPlayer(playerId, 'chatAdded', {
    id: uuid(),
    from: 'Agent',
    fromId: 'agent-system',
    body: message,
    createdAt: new Date().toISOString(),
  });
}

export function broadcastAgentAnnouncement(
  broadcast: BroadcastManager,
  message: string
): void {
  // Broadcast to all players
  broadcast.sendToAll('chatAdded', {
    id: uuid(),
    from: 'System',
    fromId: 'system',
    body: message,
    createdAt: new Date().toISOString(),
  });
}
```

### Key Integration Points

| Integration Point | Access Pattern | Use Case |
|-------------------|----------------|----------|
| `world.on(EventType.X)` | Event subscription | React to game events |
| `world.emit(EventType.X)` | Event emission | Trigger game actions |
| `broadcastManager.sendToPlayer()` | Direct messaging | Send to specific player |
| `broadcastManager.sendToAll()` | Broadcast | Announce to all players |
| `/api/actions/available` | HTTP API | Discover available actions |
| `/api/actions/:name` | HTTP API | Execute actions via REST |
| `socket.player` | Socket context | Access current player entity |
| `world.entities` | Entity registry | Query all game entities |

---

## File Reference

| File | Purpose |
|------|---------|
| `packages/server/src/systems/ServerNetwork/index.ts` | Main network system |
| `packages/server/src/systems/ServerNetwork/broadcast.ts` | Message broadcasting |
| `packages/server/src/systems/ServerNetwork/event-bridge.ts` | World → Network bridge |
| `packages/server/src/systems/ServerNetwork/connection-handler.ts` | Connection flow |
| `packages/server/src/systems/ServerNetwork/movement.ts` | Movement handling |
| `packages/server/src/systems/ServerNetwork/character-selection.ts` | Character management |
| `packages/server/src/systems/ServerNetwork/socket-management.ts` | Socket health |
| `packages/server/src/systems/ServerNetwork/handlers/*.ts` | Packet handlers |
| `packages/shared/src/types/events/event-types.ts` | EventType enum |
| `packages/server/src/startup/routes/*.ts` | REST API routes |
| `packages/plugin-hyperscape/src/events.ts` | ElizaOS event types |

---

## Detailed ElizaOS Plugin Architecture

This section maps Hyperscape server outputs to ElizaOS plugin components with proper typing, privacy, and dynamic/static configuration.

### Data Structures

#### Skills Data

```typescript
// From SkillsSystem.ts - Skills managed by the server
interface SkillData {
  level: number;  // 1-99 (max level)
  xp: number;     // 0-200,000,000 (XP cap)
}

interface Skills {
  // Combat Skills
  attack: SkillData;
  strength: SkillData;
  defense: SkillData;
  constitution: SkillData;  // Health/HP skill
  ranged: SkillData;

  // Gathering Skills
  woodcutting: SkillData;
  fishing: SkillData;

  // Artisan Skills
  firemaking: SkillData;
  cooking: SkillData;
}

// Combat level formula (RuneScape-style)
// Base = 0.25 * (Defense + Constitution + Prayer/2)
// Melee = 0.325 * (Attack + Strength)
// Ranged = 0.325 * (Ranged * 1.5)
// Combat Level = floor(Base + max(Melee, Ranged))
```

#### Combat Data

```typescript
// From CombatSystem.ts
enum CombatStyle {
  AGGRESSIVE = "aggressive",   // Trains Strength
  CONTROLLED = "controlled",   // Trains Attack/Strength/Defense equally
  DEFENSIVE = "defensive",     // Trains Defense
  ACCURATE = "accurate",       // Trains Attack
  LONGRANGE = "longrange",     // Ranged + Defense
}

interface CombatData {
  attackerId: string;
  targetId: string;
  attackerType: "player" | "mob";
  targetType: "player" | "mob";
  weaponType: "melee" | "ranged";
  inCombat: boolean;
  lastAttackTime: number;
  combatEndTime?: number;
}

interface CombatStateData {
  isInCombat: boolean;
  target: string | null;
  lastAttackTime: number;
  attackCooldown: number;
  damage: number;
  range: number;
}
```

#### Inventory Data

```typescript
// From inventory-types.ts
interface InventoryItem {
  slot: number;           // 0-27 (28 slots)
  itemId: string;
  quantity: number;
  item: {
    id: string;
    name: string;
    type: string;
    stackable: boolean;
    weight: number;
  };
}

interface Equipment {
  weapon?: { item: Item; itemId: string };
  shield?: { item: Item; itemId: string };
  helmet?: { item: Item; itemId: string };
  body?: { item: Item; itemId: string };
  legs?: { item: Item; itemId: string };
  boots?: { item: Item; itemId: string };
  gloves?: { item: Item; itemId: string };
  cape?: { item: Item; itemId: string };
  amulet?: { item: Item; itemId: string };
  ring?: { item: Item; itemId: string };
}

interface PlayerUIState {
  playerId: string;
  health: { current: number; max: number };
  skills: Skills;
  inventory: InventoryItem[];
  equipment: Equipment;
  combatLevel: number;
  inCombat: boolean;
  minimapData: { position: { x: number; y: number; z: number } };
}
```

---

### Providers (Context Suppliers)

Providers supply contextual data to the agent BEFORE decision-making. Configure based on data volatility and privacy needs.

#### Provider Classification Guide

| Provider Type | `dynamic` | `private` | Use Case |
|--------------|-----------|-----------|----------|
| World State | `true` | `false` | Real-time player/entity data |
| Player Skills | `true` | `false` | Current skill levels for context |
| Combat State | `true` | `false` | Active combat info |
| Inventory | `true` | `true` | Sensitive player inventory |
| Equipment Stats | `true` | `true` | Equipment bonuses (internal) |
| Server Config | `false` | `true` | Static server settings |
| XP Tables | `false` | `false` | Static XP formulas |

#### World State Provider (PUBLIC, DYNAMIC)

```typescript
import type { Provider, IAgentRuntime, Memory, ProviderResult } from '@elizaos/core';

/**
 * Provides real-time world state for agent context.
 * PUBLIC: Visible in provider list for debugging
 * DYNAMIC: Re-fetched each message (data changes frequently)
 */
export const worldStateProvider: Provider = {
  name: 'HYPERSCAPE_WORLD_STATE',
  description: 'Current game world state including players, mobs, and resources',
  dynamic: true,   // Re-fetch each time - world changes constantly
  private: false,  // Show in provider list
  position: -50,   // Load early - other providers may depend on this

  get: async (runtime: IAgentRuntime, message: Memory): Promise<ProviderResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    if (!world) {
      return { text: 'Hyperscape not connected', data: { connected: false } };
    }

    // Collect all players
    const players: PlayerSummary[] = [];
    const mobs: MobSummary[] = [];

    world.entities.items.forEach((entity, id) => {
      if (entity.type === 'player') {
        const stats = entity.getComponent('stats')?.data;
        players.push({
          id,
          name: entity.data.name,
          position: { x: entity.position.x, y: entity.position.y, z: entity.position.z },
          health: stats?.health?.current ?? 0,
          maxHealth: stats?.health?.max ?? 10,
          combatLevel: stats?.combatLevel ?? 3,
          inCombat: entity.data.inCombat ?? false,
        });
      } else if (entity.type === 'mob') {
        mobs.push({
          id,
          type: entity.data.mobType,
          name: entity.data.name,
          position: { x: entity.position.x, y: entity.position.y, z: entity.position.z },
          health: entity.data.health,
          isAggressive: entity.data.aggressive ?? false,
        });
      }
    });

    // Build natural language context for the agent
    const text = `
## Current World State
- **Online Players**: ${players.length}
- **Active Mobs**: ${mobs.length}
- **World Time**: ${Math.floor(world.time)}s

### Players Online
${players.map(p => `- ${p.name} (Combat Lv. ${p.combatLevel}) at [${Math.round(p.position.x)}, ${Math.round(p.position.z)}]${p.inCombat ? ' [IN COMBAT]' : ''}`).join('\n')}

### Nearby Mobs
${mobs.slice(0, 10).map(m => `- ${m.name} (${m.type}) at [${Math.round(m.position.x)}, ${Math.round(m.position.z)}]`).join('\n')}
    `.trim();

    return {
      text,
      data: {
        connected: true,
        worldTime: world.time,
        playerCount: players.length,
        mobCount: mobs.length,
        players,
        mobs,
      },
      values: {
        playerCount: players.length,
        mobCount: mobs.length,
        worldTime: world.time,
      },
    };
  },
};
```

#### Player Skills Provider (PUBLIC, DYNAMIC)

```typescript
/**
 * Provides current player skill data.
 * Used to understand player progression and capabilities.
 */
export const playerSkillsProvider: Provider = {
  name: 'HYPERSCAPE_PLAYER_SKILLS',
  description: 'Player skill levels and XP for all skills',
  dynamic: true,   // Skills change with XP gains
  private: false,
  position: -40,

  get: async (runtime: IAgentRuntime, message: Memory): Promise<ProviderResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    const skillsSystem = world?.getSystem<SkillsSystem>('skills');

    // Get the player associated with this message
    const playerId = message.userId || message.entityId;
    if (!playerId || !skillsSystem) {
      return { text: '', data: {} };
    }

    const skills = skillsSystem.getSkills(playerId);
    if (!skills) {
      return { text: 'No skill data available', data: {} };
    }

    const combatLevel = calculateCombatLevel(skills);
    const totalLevel = Object.values(skills).reduce((sum, s) => sum + s.level, 0);

    const text = `
## Player Skills (Combat Level: ${combatLevel}, Total Level: ${totalLevel})

### Combat Skills
- Attack: ${skills.attack.level} (${formatXP(skills.attack.xp)} XP)
- Strength: ${skills.strength.level} (${formatXP(skills.strength.xp)} XP)
- Defense: ${skills.defense.level} (${formatXP(skills.defense.xp)} XP)
- Constitution: ${skills.constitution.level} (${formatXP(skills.constitution.xp)} XP)
- Ranged: ${skills.ranged.level} (${formatXP(skills.ranged.xp)} XP)

### Gathering Skills
- Woodcutting: ${skills.woodcutting.level} (${formatXP(skills.woodcutting.xp)} XP)
- Fishing: ${skills.fishing.level} (${formatXP(skills.fishing.xp)} XP)

### Artisan Skills
- Firemaking: ${skills.firemaking.level} (${formatXP(skills.firemaking.xp)} XP)
- Cooking: ${skills.cooking.level} (${formatXP(skills.cooking.xp)} XP)
    `.trim();

    return {
      text,
      data: { skills, combatLevel, totalLevel },
      values: { combatLevel, totalLevel },
    };
  },
};
```

#### Combat State Provider (PUBLIC, DYNAMIC)

```typescript
/**
 * Provides active combat information.
 * Critical for agents that need to react to combat situations.
 */
export const combatStateProvider: Provider = {
  name: 'HYPERSCAPE_COMBAT_STATE',
  description: 'Current combat state including active fights and recent damage',
  dynamic: true,   // Combat state changes rapidly
  private: false,
  position: -30,

  get: async (runtime: IAgentRuntime, message: Memory): Promise<ProviderResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    const combatSystem = world?.getSystem<CombatSystem>('combat');

    const playerId = message.userId || message.entityId;
    if (!playerId || !combatSystem) {
      return { text: '', data: { inCombat: false } };
    }

    const combatData = combatSystem.getCombatData(playerId);
    const isInCombat = combatSystem.isInCombat(playerId);

    if (!isInCombat || !combatData) {
      return {
        text: 'Player is not in combat.',
        data: { inCombat: false },
        values: { inCombat: false },
      };
    }

    // Get target info
    const target = world.entities.get(combatData.targetId);
    const targetName = target?.data?.name || 'Unknown';
    const targetHealth = target?.data?.health || 0;

    const text = `
## Active Combat
- **Target**: ${targetName}
- **Target Health**: ${targetHealth}
- **Combat Style**: ${combatData.combatStyle || 'melee'}
- **Time in Combat**: ${Math.floor((Date.now() - combatData.startTime) / 1000)}s
    `.trim();

    return {
      text,
      data: {
        inCombat: true,
        targetId: combatData.targetId,
        targetName,
        targetHealth,
        combatStyle: combatData.combatStyle,
        startTime: combatData.startTime,
      },
      values: { inCombat: true, targetName },
    };
  },
};
```

#### Inventory Provider (PRIVATE, DYNAMIC)

```typescript
/**
 * Provides player inventory data.
 * PRIVATE: Sensitive data, hidden from default provider list
 */
export const inventoryProvider: Provider = {
  name: 'HYPERSCAPE_INVENTORY',
  description: 'Player inventory contents and coins',
  dynamic: true,
  private: true,   // Don't expose inventory publicly
  position: -20,

  get: async (runtime: IAgentRuntime, message: Memory): Promise<ProviderResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    const inventorySystem = world?.getSystem<InventorySystem>('inventory');

    const playerId = message.userId || message.entityId;
    if (!playerId || !inventorySystem) {
      return { text: '', data: {} };
    }

    const inventory = inventorySystem.getPlayerInventory(playerId);
    if (!inventory) {
      return { text: 'No inventory data', data: {} };
    }

    const items = inventory.items.filter(i => i !== null);
    const coins = inventory.coins || 0;
    const usedSlots = items.length;
    const maxSlots = inventory.maxSlots || 28;

    const text = `
## Inventory (${usedSlots}/${maxSlots} slots)
- **Coins**: ${formatNumber(coins)} gp

### Items
${items.map(i => `- [${i.slot}] ${i.item.name} x${i.quantity}`).join('\n') || 'Empty inventory'}
    `.trim();

    return {
      text,
      data: { items, coins, usedSlots, maxSlots },
      values: { coins, usedSlots, maxSlots },
    };
  },
};
```

#### Equipment Stats Provider (PRIVATE, DYNAMIC)

```typescript
/**
 * Provides equipment stat bonuses for internal calculations.
 * PRIVATE: Internal use only, not needed in agent context
 */
export const equipmentStatsProvider: Provider = {
  name: 'HYPERSCAPE_EQUIPMENT_STATS',
  description: 'Equipment stat bonuses for combat calculations',
  dynamic: true,
  private: true,   // Internal calculation data
  position: 0,

  get: async (runtime: IAgentRuntime, message: Memory): Promise<ProviderResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    const equipmentSystem = world?.getSystem<EquipmentSystem>('equipment');

    const playerId = message.userId || message.entityId;
    if (!playerId || !equipmentSystem) {
      return { text: '', data: {} };
    }

    const equipment = equipmentSystem.getPlayerEquipment(playerId);
    const stats = equipmentSystem.calculateEquipmentStats(playerId);

    return {
      text: '', // No text needed - internal use
      data: {
        equipment,
        bonuses: {
          attack: stats.attack,
          strength: stats.strength,
          defense: stats.defense,
          ranged: stats.ranged,
        },
      },
      values: stats,
    };
  },
};
```

---

### Actions (Agent Capabilities)

Actions define what the agent CAN DO in the game world.

#### Attack Mob Action

```typescript
import type { Action, IAgentRuntime, Memory, ActionResult } from '@elizaos/core';

export const attackMobAction: Action = {
  name: 'ATTACK_MOB',
  description: 'Attack a specific mob/enemy in the game world',
  similes: ['fight', 'kill', 'slay', 'attack', 'engage'],

  examples: [[
    { name: 'user', content: { text: 'Attack the goblin' } },
    { name: 'agent', content: { text: 'Engaging goblin in combat!' } }
  ], [
    { name: 'user', content: { text: 'Kill that chicken' } },
    { name: 'agent', content: { text: 'Attacking chicken...' } }
  ]],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    if (!world) return false;

    // Check if player exists and is alive
    const playerId = message.userId || message.entityId;
    const player = world.entities.players.get(playerId);
    if (!player || player.data.isDead) return false;

    // Check if message mentions attacking
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('attack') || text.includes('fight') ||
           text.includes('kill') || text.includes('slay');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory
  ): Promise<ActionResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    if (!world) {
      return { success: false, error: 'Game world not connected' };
    }

    const playerId = message.userId || message.entityId;
    const text = message.content.text?.toLowerCase() || '';

    // Find target mob by name in message
    const targetMob = findMobByName(world, text);
    if (!targetMob) {
      return {
        success: false,
        text: 'Could not find that enemy nearby.',
        error: 'target_not_found'
      };
    }

    // Emit combat attack request
    world.emit(EventType.COMBAT_ATTACK_REQUEST, {
      playerId,
      targetId: targetMob.id,
      attackerType: 'player',
      targetType: 'mob',
      attackType: 'melee',
    });

    return {
      success: true,
      text: `Attacking ${targetMob.data.name}!`,
      data: {
        targetId: targetMob.id,
        targetName: targetMob.data.name,
      },
    };
  },
};
```

#### Gather Resource Action

```typescript
export const gatherResourceAction: Action = {
  name: 'GATHER_RESOURCE',
  description: 'Gather a resource like trees, fishing spots, or ore',
  similes: ['chop', 'cut', 'fish', 'mine', 'gather', 'harvest'],

  examples: [[
    { name: 'user', content: { text: 'Chop down that tree' } },
    { name: 'agent', content: { text: 'Starting to chop the tree...' } }
  ], [
    { name: 'user', content: { text: 'Go fishing' } },
    { name: 'agent', content: { text: 'Finding a fishing spot...' } }
  ]],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('chop') || text.includes('fish') ||
           text.includes('mine') || text.includes('gather');
  },

  handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    if (!world) {
      return { success: false, error: 'Game world not connected' };
    }

    const playerId = message.userId || message.entityId;
    const player = world.entities.players.get(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Find nearest resource
    const text = message.content.text?.toLowerCase() || '';
    const resourceType = text.includes('fish') ? 'fishing_spot' :
                        text.includes('chop') ? 'tree' :
                        text.includes('mine') ? 'rock' : 'tree';

    const nearestResource = findNearestResource(world, player.position, resourceType);
    if (!nearestResource) {
      return { success: false, text: `No ${resourceType} nearby.` };
    }

    // Emit gather event
    world.emit(EventType.RESOURCE_GATHER, {
      playerId,
      resourceId: nearestResource.id,
      playerPosition: player.position,
    });

    return {
      success: true,
      text: `Gathering from ${nearestResource.data.name}...`,
      data: { resourceId: nearestResource.id, resourceType },
    };
  },
};
```

#### Send Chat Message Action

```typescript
export const sendChatAction: Action = {
  name: 'SEND_CHAT',
  description: 'Send a message to the game chat',
  similes: ['say', 'chat', 'tell', 'announce', 'speak'],

  validate: async () => true, // Always available

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    const broadcast = runtime.getService<BroadcastManager>('broadcast');

    if (!world || !broadcast) {
      return { success: false, error: 'Services not available' };
    }

    const agentMessage = message.content.text || '';

    // Broadcast to all players
    broadcast.sendToAll('chatAdded', {
      id: crypto.randomUUID(),
      from: 'Agent',
      fromId: 'agent-system',
      body: agentMessage,
      createdAt: new Date().toISOString(),
    });

    // Also notify via callback if available
    if (callback) {
      await callback({ text: `Sent: "${agentMessage}"` }, []);
    }

    return {
      success: true,
      text: `Message sent to chat: "${agentMessage}"`,
    };
  },
};
```

#### Change Attack Style Action

```typescript
export const changeAttackStyleAction: Action = {
  name: 'CHANGE_ATTACK_STYLE',
  description: 'Change combat attack style (accurate, aggressive, defensive, controlled)',
  similes: ['switch style', 'change style', 'train', 'focus'],

  examples: [[
    { name: 'user', content: { text: 'I want to train strength' } },
    { name: 'agent', content: { text: 'Switching to aggressive style to train strength.' } }
  ]],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('style') || text.includes('train') ||
           text.includes('aggressive') || text.includes('defensive') ||
           text.includes('accurate') || text.includes('controlled');
  },

  handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult> => {
    const world = runtime.getService<HyperscapeWorld>('hyperscape');
    if (!world) {
      return { success: false, error: 'Game world not connected' };
    }

    const playerId = message.userId || message.entityId;
    const text = message.content.text?.toLowerCase() || '';

    // Determine desired style
    let newStyle: CombatStyle;
    if (text.includes('strength') || text.includes('aggressive')) {
      newStyle = CombatStyle.AGGRESSIVE;
    } else if (text.includes('defense') || text.includes('defensive')) {
      newStyle = CombatStyle.DEFENSIVE;
    } else if (text.includes('attack') || text.includes('accurate')) {
      newStyle = CombatStyle.ACCURATE;
    } else {
      newStyle = CombatStyle.CONTROLLED;
    }

    // Emit style change
    world.emit(EventType.ATTACK_STYLE_CHANGED, {
      playerId,
      newStyle,
    });

    const skillTrained = {
      [CombatStyle.AGGRESSIVE]: 'Strength',
      [CombatStyle.DEFENSIVE]: 'Defense',
      [CombatStyle.ACCURATE]: 'Attack',
      [CombatStyle.CONTROLLED]: 'Attack, Strength, and Defense',
    };

    return {
      success: true,
      text: `Switched to ${newStyle} style. Now training ${skillTrained[newStyle]}.`,
      data: { newStyle, training: skillTrained[newStyle] },
    };
  },
};
```

---

### Evaluators (Post-Response Processors)

Evaluators extract information and update state AFTER agent responses.

#### Combat Event Evaluator

```typescript
import type { Evaluator, IAgentRuntime, Memory } from '@elizaos/core';

/**
 * Extracts combat events and updates agent memory about fights.
 */
export const combatEventEvaluator: Evaluator = {
  name: 'COMBAT_EVENT_EVALUATOR',
  description: 'Tracks combat events and extracts fight outcomes',
  alwaysRun: false, // Only run when relevant

  examples: [{
    prompt: 'Track combat damage dealt',
    messages: [
      { name: 'system', content: { text: 'Player dealt 15 damage to Goblin' } },
    ],
    outcome: 'Combat damage tracked: 15 to Goblin',
  }],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    // Run when message mentions combat or damage
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('damage') || text.includes('killed') ||
           text.includes('combat') || text.includes('died');
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const text = message.content.text || '';

    // Extract combat data
    const damageMatch = text.match(/dealt (\d+) damage to (.+)/i);
    const killMatch = text.match(/killed (.+)/i);
    const deathMatch = text.match(/was killed by (.+)/i);

    const combatEvent: CombatEvent = {
      timestamp: Date.now(),
      type: killMatch ? 'kill' : deathMatch ? 'death' : 'damage',
      damage: damageMatch ? parseInt(damageMatch[1]) : undefined,
      target: damageMatch?.[2] || killMatch?.[1] || deathMatch?.[1],
    };

    // Store in memory for future context
    await runtime.databaseAdapter.createMemory({
      id: crypto.randomUUID(),
      entityId: message.entityId,
      roomId: message.roomId,
      content: {
        text: `Combat event: ${combatEvent.type}`,
        data: combatEvent,
      },
      type: 'combat_event',
    });

    return combatEvent;
  },
};
```

#### Level Up Evaluator

```typescript
/**
 * Tracks level-up events to congratulate players.
 */
export const levelUpEvaluator: Evaluator = {
  name: 'LEVEL_UP_EVALUATOR',
  description: 'Detects and records skill level ups',
  alwaysRun: true, // Important milestone tracking

  examples: [{
    prompt: 'Player leveled up',
    messages: [
      { name: 'system', content: { text: 'Player reached level 50 Woodcutting!' } },
    ],
    outcome: 'Level up recorded: Woodcutting 50',
  }],

  validate: async () => true,

  handler: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text || '';

    // Look for level up patterns
    const levelMatch = text.match(/reached level (\d+) (.+)/i);
    if (!levelMatch) return null;

    const level = parseInt(levelMatch[1]);
    const skill = levelMatch[2];

    // Store milestone in facts
    await runtime.factsManager?.addFact({
      type: 'skill_milestone',
      content: `Reached level ${level} in ${skill}`,
      timestamp: Date.now(),
    });

    // Check for special milestones
    const isMilestone = [50, 92, 99].includes(level);
    if (isMilestone) {
      // Could trigger congratulation action here
    }

    return { skill, level, isMilestone };
  },
};
```

---

### Services (Persistent Connections)

Services manage long-running connections and state.

#### Hyperscape Connection Service

```typescript
import { Service, IAgentRuntime, logger } from '@elizaos/core';
import { World, EventType } from '@hyperscape/shared';

export class HyperscapeService extends Service {
  static serviceType = 'hyperscape';
  capabilityDescription = 'Manages connection to Hyperscape game server';

  private world!: World;
  private eventHandlers: Map<string, Function> = new Map();

  constructor(protected runtime: IAgentRuntime) {
    super();
  }

  static async start(runtime: IAgentRuntime): Promise<HyperscapeService> {
    logger.info('[HyperscapeService] Starting...');
    const service = new HyperscapeService(runtime);
    await service.initialize();
    return service;
  }

  private async initialize(): Promise<void> {
    const serverUrl = this.runtime.getSetting('HYPERSCAPE_SERVER_URL');
    if (!serverUrl) {
      throw new Error('HYPERSCAPE_SERVER_URL not configured');
    }

    // Connect to world
    this.world = await this.connectToWorld(serverUrl);

    // Set up event listeners
    this.setupEventListeners();

    logger.info('[HyperscapeService] Connected to Hyperscape server');
  }

  private setupEventListeners(): void {
    // Player events
    this.world.on(EventType.PLAYER_JOINED, (data) => {
      logger.info(`[Hyperscape] Player joined: ${data.player.data.name}`);
      this.runtime.emit('hyperscape:player_joined', data);
    });

    this.world.on(EventType.PLAYER_DIED, (data) => {
      logger.info(`[Hyperscape] Player died: ${data.playerId}`);
      this.runtime.emit('hyperscape:player_died', data);
    });

    // Combat events
    this.world.on(EventType.COMBAT_KILL, (data) => {
      logger.info(`[Hyperscape] Kill: ${data.attackerId} -> ${data.targetId}`);
      this.runtime.emit('hyperscape:combat_kill', data);
    });

    this.world.on(EventType.COMBAT_DAMAGE_DEALT, (data) => {
      this.runtime.emit('hyperscape:damage_dealt', data);
    });

    // Skill events
    this.world.on(EventType.SKILLS_LEVEL_UP, (data) => {
      logger.info(`[Hyperscape] Level up: ${data.playerId} ${data.skill} -> ${data.newLevel}`);
      this.runtime.emit('hyperscape:level_up', data);
    });

    // Chat events
    this.world.on(EventType.CHAT_MESSAGE, (data) => {
      this.runtime.emit('hyperscape:chat', data);
    });
  }

  // Public API for other components
  getWorld(): World {
    return this.world;
  }

  getPlayer(playerId: string): PlayerEntity | undefined {
    return this.world.entities.players.get(playerId);
  }

  getMobs(): Map<string, MobEntity> {
    const mobs = new Map();
    this.world.entities.items.forEach((entity, id) => {
      if (entity.type === 'mob') {
        mobs.set(id, entity);
      }
    });
    return mobs;
  }

  async stop(): Promise<void> {
    // Clean up event handlers
    this.eventHandlers.forEach((handler, event) => {
      this.world.off(event, handler);
    });
    this.eventHandlers.clear();

    // Disconnect from world
    if (this.world) {
      await this.world.disconnect?.();
    }

    logger.info('[HyperscapeService] Stopped');
  }
}
```

---

### Complete Plugin Definition

```typescript
import type { Plugin } from '@elizaos/core';

export const hyperscapePlugin: Plugin = {
  name: '@elizaos/plugin-hyperscape',
  description: 'Hyperscape MMORPG integration for ElizaOS agents',

  // Core service - manages world connection
  services: [HyperscapeService],

  // Providers - supply game state to agent context
  providers: [
    worldStateProvider,       // PUBLIC, DYNAMIC - world state
    playerSkillsProvider,     // PUBLIC, DYNAMIC - player skills
    combatStateProvider,      // PUBLIC, DYNAMIC - combat info
    inventoryProvider,        // PRIVATE, DYNAMIC - inventory
    equipmentStatsProvider,   // PRIVATE, DYNAMIC - equipment bonuses
  ],

  // Actions - what the agent can do
  actions: [
    attackMobAction,
    gatherResourceAction,
    sendChatAction,
    changeAttackStyleAction,
    // ... more actions
  ],

  // Evaluators - post-response processing
  evaluators: [
    combatEventEvaluator,
    levelUpEvaluator,
  ],

  // Plugin initialization
  init: async (config, runtime) => {
    const serverUrl = runtime.getSetting('HYPERSCAPE_SERVER_URL');
    if (!serverUrl) {
      console.warn('[plugin-hyperscape] HYPERSCAPE_SERVER_URL not set');
    }
  },

  // Dependencies
  dependencies: ['@elizaos/plugin-bootstrap'],
};

export default hyperscapePlugin;
```

---

### Provider/Action Classification Summary

| Component | Type | Dynamic | Private | Purpose |
|-----------|------|---------|---------|---------|
| `worldStateProvider` | Provider | `true` | `false` | Real-time world snapshot |
| `playerSkillsProvider` | Provider | `true` | `false` | Skill levels for context |
| `combatStateProvider` | Provider | `true` | `false` | Active combat info |
| `inventoryProvider` | Provider | `true` | `true` | Sensitive inventory data |
| `equipmentStatsProvider` | Provider | `true` | `true` | Internal stat calculations |
| `attackMobAction` | Action | - | - | Combat engagement |
| `gatherResourceAction` | Action | - | - | Resource gathering |
| `sendChatAction` | Action | - | - | Chat messaging |
| `changeAttackStyleAction` | Action | - | - | Combat style switching |
| `combatEventEvaluator` | Evaluator | - | - | Track combat outcomes |
| `levelUpEvaluator` | Evaluator | - | - | Record skill milestones |
| `HyperscapeService` | Service | - | - | Manage world connection |
