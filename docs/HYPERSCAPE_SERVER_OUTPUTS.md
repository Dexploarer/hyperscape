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

  static async start(runtime: IAgentRuntime): Promise<HyperscapeEventService> {
    const service = new HyperscapeEventService(runtime);
    await service.initialize();
    return service;
  }

  private async initialize(): Promise<void> {
    this.world = this.runtime.getService<World>('hyperscape')!;

    // React to player joins
    this.world.on(EventType.PLAYER_JOINED, async (payload) => {
      const { playerId, player } = payload;
      console.log(`Player ${player.data.name} joined!`);
      // Trigger agent greeting or action
    });

    // React to combat kills
    this.world.on(EventType.COMBAT_KILL, async (payload) => {
      const { attackerId, targetId } = payload;
      // Log or react to kills
    });

    // React to level ups
    this.world.on(EventType.SKILLS_LEVEL_UP, async (payload) => {
      const { playerId, skill, newLevel } = payload;
      // Congratulate player or adjust difficulty
    });

    // React to deaths
    this.world.on(EventType.PLAYER_DIED, async (payload) => {
      const { playerId } = payload;
      // Offer assistance or commentary
    });

    // React to chat messages
    this.world.on(EventType.CHAT_MESSAGE, async (payload) => {
      const { from, body } = payload;
      // Process chat for agent responses
    });
  }

  async stop(): Promise<void> {
    // Cleanup listeners
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
