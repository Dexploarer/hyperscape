/**
 * Event System Types
 * 
 * Type definitions for the event system:
 * - EventType enum (all event names)
 * - Event payload interfaces (specific data for each event)
 * - Event system interfaces (subscriptions, handlers)
 * - Event mapping (type-safe emit/on/off)
 */

import { Entity } from '../entities/Entity';
import { PlayerLocal } from '../entities/PlayerLocal';
import {
  Skills,
  InventoryItem,
  Position3D,
} from './core';
import type { Resource } from './core';
import type { Item } from './core';
import type { EntitySpawnedEvent } from './system-interfaces';

// ============================================================================
// EVENT TYPE ENUM
// ============================================================================

export enum EventType {
  // General System
  READY = 'ready',
  ERROR = 'error',
  TICK = 'tick',

  // Player Core
  PLAYER_JOINED = 'player:joined',
  PLAYER_LEFT = 'player:left',
  PLAYER_LOGOUT = 'player:logout',
  PLAYER_RECONNECTED = 'player:reconnected',
  PLAYER_AVATAR_READY = 'player:avatar_ready',
  PLAYER_INIT = 'player:init',
  PLAYER_READY = 'player:ready',
  PLAYER_REGISTERED = 'player:registered',
  PLAYER_UNREGISTERED = 'player:unregistered',
  PLAYER_CLEANUP = 'player:cleanup',
  PLAYER_AUTHENTICATED = 'player:authenticated',
  PLAYER_UPDATED = 'player:updated',
  PLAYER_SPAWNED = 'player:spawned',
  PLAYER_SPAWN_REQUEST = 'player:spawn_request',
  PLAYER_DATA_LOADED = 'player:data_loaded',
  PLAYER_DATA_SAVED = 'player:data_saved',
  PLAYER_SESSION_STARTED = 'player:session_started',
  PLAYER_SESSION_ENDED = 'player:session_ended',
  PLAYER_CREATE = 'player:create',
  PLAYER_SPAWN_COMPLETE = 'player:spawn_complete',
  PLAYER_ANIMATION = 'player:animation',
  
  // Entity Management
  ENTITY_CREATED = 'entity:created',
  ENTITY_UPDATED = 'entity:updated',
  ENTITY_INTERACT = 'entity:interact',
  ENTITY_INTERACTED = 'entity:interacted',
  ENTITY_MOVE_REQUEST = 'entity:move_request',
  ENTITY_PROPERTY_REQUEST = 'entity:property_request',
  ENTITY_SPAWNED = 'entity:spawned',
  ENTITY_DEATH = 'entity:death',
  ENTITY_POSITION_CHANGED = 'entity:position_changed',
  ENTITY_UNDERGROUND_DETECTED = 'entity:underground_detected',
  ENTITY_POSITION_CORRECTED = 'entity:position_corrected',
  ENTITY_COMPONENT_ADDED = 'entity:component:added',
  ENTITY_COMPONENT_REMOVED = 'entity:component:removed',
  ENTITY_HEALTH_CHANGED = 'entity:health_changed',
  ENTITY_DAMAGED = 'entity:damaged',
  ENTITY_HEALED = 'entity:healed',
  ENTITY_LEVEL_CHANGED = 'entity:level_changed',

  // Asset Management
  ASSET_LOADED = 'asset:loaded',
  ASSETS_LOADING_PROGRESS = 'assets:loading:progress',

  // UI System
  UI_TOGGLE = 'ui:toggle',
  UI_OPEN_PANE = 'ui:open_pane',
  UI_CLOSE_PANE = 'ui:close_pane',
  UI_MENU = 'ui:menu',
  UI_AVATAR = 'ui:avatar',
  UI_KICK = 'ui:kick',
  UI_TOAST = 'ui:toast',
  UI_SIDEBAR_CHAT_TOGGLE = 'ui:sidebar:chat:toggle',
  UI_ACTIONS_UPDATE = 'ui:actions:update',
  UI_UPDATE = 'ui',

  // Network Communication
  NETWORK_CONNECTED = 'network:connected',
  NETWORK_DISCONNECTED = 'network:disconnected',
  NETWORK_MESSAGE_RECEIVED = 'network:message:received',
  NETWORK_ENTITY_UPDATES = 'network:entity_updates',

  // Client Communication
  CLIENT_CONNECT = 'client:connect',
  CLIENT_DISCONNECT = 'client:disconnect',
  CLIENT_ENTITY_SYNC = 'client:entity_sync',

  // Input System
  INPUT_KEY_DOWN = 'input:key:down',
  INPUT_KEY_UP = 'input:key:up',
  INPUT_POINTER_DOWN = 'input:pointer:down',
  INPUT_POINTER_UP = 'input:pointer:up',
  INPUT_POINTER_MOVE = 'input:pointer:move',

  // System Settings
  SETTINGS_CHANGED = 'settings:changed',

  // Graphics System
  GRAPHICS_RESIZE = 'graphics:resize',

  // XR System
  XR_SESSION = 'xr:session',

  // Terrain System
  TERRAIN_TILE_GENERATED = 'terrain:tile:generated',
  TERRAIN_VALIDATION_COMPLETE = 'terrain:validation:complete',
  TERRAIN_PHYSICS_READY = 'terrain:physics:ready',

  // Camera System
  CAMERA_SET_TARGET = 'camera:set_target',
  CAMERA_CLICK_WORLD = 'camera:click:world',
  CAMERA_SET_MODE = 'camera:set:mode',
  CAMERA_RESET = 'camera:reset',
  CAMERA_TAP = 'camera:tap',
  CAMERA_TARGET_CHANGED = 'camera:target:changed',
  CAMERA_FOLLOW_PLAYER = 'camera:follow_player',

  // Movement System
  MOVEMENT_STOP = 'movement:stop',
  MOVEMENT_TOGGLE_RUN = 'movement:toggle:run',
  MOVEMENT_STARTED = 'movement:started',
  MOVEMENT_STOPPED = 'movement:stopped',
  MOVEMENT_SPEED_CHANGED = 'movement:speed:changed',
  MOVEMENT_STAMINA_DEPLETED = 'movement:stamina:depleted',
  PLAYER_STAMINA_UPDATE = 'player:stamina:update',
  MOVEMENT_COMPLETED = 'movement:completed',
  MOVEMENT_CLICK_TO_MOVE = 'movement:click_to_move',

  // Player Stats & Progression
  PLAYER_LEVEL_UP = 'player:level_up',
  PLAYER_LEVEL_CHANGED = 'player:level_changed',
  PLAYER_XP_GAINED = 'player:xp_gained',
  PLAYER_SKILLS_UPDATED = 'player:skills_updated',

  // Player Health & Status
  PLAYER_HEALTH_UPDATED = 'player:health_updated',
  PLAYER_DAMAGE = 'player:damage',
  PLAYER_DIED = 'player:died',
  PLAYER_RESPAWNED = 'player:respawned',
  PLAYER_RESPAWN_REQUEST = 'player:respawn_request',
  PLAYER_DESTROY = 'player:destroy',

  // Player Equipment & Stats
  PLAYER_EQUIPMENT_CHANGED = 'player:equipment_changed',
  PLAYER_EQUIPMENT_UPDATED = 'player:equipment_updated',
  PLAYER_STATS_EQUIPMENT_UPDATED = 'player:stats:equipment_updated',

  // Player Movement & Position
  PLAYER_POSITION_UPDATED = 'player:position:updated',
  PLAYER_TELEPORT_REQUEST = 'player:teleport_request',
  PLAYER_TELEPORTED = 'player:teleported',

  // Player Combat Style
  ATTACK_STYLE_CHANGED = 'attack_style:changed',

  // Combat System
  COMBAT_STARTED = 'combat:started',
  COMBAT_ENDED = 'combat:ended',
  COMBAT_ATTACK = 'combat:attack',
  COMBAT_ATTACK_REQUEST = 'combat:attack_request',
  COMBAT_START_ATTACK = 'combat:start_attack',
  COMBAT_STOP_ATTACK = 'combat:stop_attack',
  COMBAT_ATTACK_STYLE_CHANGE = 'combat:attack_style:change',
  COMBAT_ATTACK_FAILED = 'combat:attack_failed',
  COMBAT_MELEE_ATTACK = 'combat:melee_attack',
  COMBAT_RANGED_ATTACK = 'combat:ranged_attack',
  COMBAT_MOB_ATTACK = 'combat:mob_attack',
  COMBAT_DAMAGE_DEALT = 'combat:damage_dealt',
  COMBAT_DAMAGE_CALCULATE = 'combat:damage_calculate',
  COMBAT_ACCURACY_CALCULATE = 'combat:accuracy_calculate',
  COMBAT_XP_CALCULATE = 'combat:xp_calculate',
  COMBAT_HEAL = 'combat:heal',
  COMBAT_MISS = 'combat:miss',
  COMBAT_ACTION = 'combat:action',
  COMBAT_KILL = 'combat:kill',
  COMBAT_LEVEL_CHANGED = 'combat:level:changed',

  // Aggro System
  AGGRO_PLAYER_LEFT = 'aggro:player_left',
  AGGRO_PLAYER_ENTERED = 'aggro:player_entered',
  AGGRO_MOB_AGGROED = 'aggro:mob_aggroed',

  // Inventory Management
  INVENTORY_INITIALIZED = 'inventory:initialized',
  INVENTORY_UPDATED = 'inventory:updated',
  INVENTORY_REQUEST = 'inventory:request',
  INVENTORY_FULL = 'inventory:full',
  INVENTORY_ITEM_ADDED = 'inventory:item_added',
  INVENTORY_ITEM_REMOVED = 'inventory:item_removed',
  INVENTORY_MOVE = 'inventory:move',
  INVENTORY_USE = 'inventory:use',
  INVENTORY_EXAMINE_ITEM = 'inventory:examine_item',
  INVENTORY_CONSUME_ITEM = 'inventory:consume_item',
  INVENTORY_CHECK = 'inventory:check',
  INVENTORY_CAN_ADD = 'inventory:can_add',
  INVENTORY_HAS_ITEM = 'inventory:has_item',
  INVENTORY_HAS_EQUIPPED = 'inventory:has_equipped',
  INVENTORY_ITEM_RIGHT_CLICK = 'inventory:item_right_click',
  INVENTORY_UPDATE_COINS = 'inventory:update_coins',
  INVENTORY_REMOVE_COINS = 'inventory:remove_coins',
  INVENTORY_COINS_UPDATED = 'inventory:coins_updated',
  INVENTORY_REMOVE_ITEM = 'inventory:remove_item',
  INVENTORY_ADD_COINS = 'inventory:add_coins',
  INVENTORY_DROP_ALL = 'inventory:drop_all',

  // Item Lifecycle
  ITEM_SPAWNED = 'item:spawned',
  ITEM_SPAWN = 'item:spawn',
  ITEM_SPAWN_REQUEST = 'item:spawn_request',
  ITEM_SPAWN_LOOT = 'item:spawn_loot',
  ITEM_DESPAWN = 'item:despawn',
  ITEM_DESPAWNED = 'item:despawned',
  ITEM_RESPAWN_SHOPS = 'item:respawn_shops',
  ITEM_DROPPED = 'item:dropped',
  ITEM_DROP = 'item:drop',
  LOOT_DROPPED = 'loot:dropped',
  ITEM_PICKUP = 'item:picked_up',
  ITEM_PICKUP_REQUEST = 'item:pickup_request',
  ITEM_USED = 'item:used',
  ITEM_ACTION_SELECTED = 'item:action_selected',
  ITEMS_RETRIEVED = 'items:retrieved',

  // Item Actions
  ITEM_USE_ON_FIRE = 'item:use_on_fire',
  ITEM_USE_ON_ITEM = 'item:use_on_item',
  ITEM_ON_ITEM = 'item:on:item',
  ITEM_RIGHT_CLICK = 'item:right_click',
  ITEM_ACTION_EXECUTE = 'item:action:execute',
  ITEM_EXAMINE = 'item:examine',
  ITEM_CONSUME = 'item:consume',

  // Equipment System
  EQUIPMENT_EQUIP = 'equipment:equip',
  EQUIPMENT_UNEQUIP = 'equipment:unequip',
  EQUIPMENT_TRY_EQUIP = 'equipment:try_equip',
  EQUIPMENT_FORCE_EQUIP = 'equipment:force_equip',
  EQUIPMENT_CONSUME_ARROW = 'equipment:consume_arrow',
  EQUIPMENT_EQUIPPED = 'equipment:equipped',
  EQUIPMENT_UNEQUIPPED = 'equipment:unequipped',
  EQUIPMENT_CAN_EQUIP = 'equipment:can_equip',

  // Interaction System
  INTERACTION_REGISTER = 'interaction:register',
  INTERACTION_UNREGISTER = 'interaction:unregister',

  // NPC System
  NPC_SPAWNED = 'npc:spawned',
  NPC_SPAWN_REQUEST = 'npc:spawn_request',
  NPC_INTERACTION = 'npc:interaction',
  NPC_DIALOGUE = 'npc:dialogue',
  NPC_TRAINER_OPEN = 'trainer:open_request',
  NPC_QUEST_OPEN = 'quest:open_request',

  // Quest System
  QUEST_STARTED = 'quest:started',
  QUEST_PROGRESSED = 'quest:progressed',
  QUEST_COMPLETED = 'quest:completed',

  // Mobs
  MOB_SPAWNED = 'mob:spawned',
  MOB_SPAWN_REQUEST = 'mob:spawn_request',
  MOB_SPAWN_POINTS_REGISTERED = 'mob:spawn_points:registered',
  MOB_DESPAWN = 'mob:despawn',
  MOB_DESPAWNED = 'mob:despawned',
  MOB_RESPAWN_ALL = 'mob:respawn_all',
  MOB_RESPAWNED = 'mob:respawn',
  MOB_DAMAGED = 'mob:damaged',
  MOB_POSITION_UPDATED = 'mob:position_updated',
  MOB_ATTACKED = 'mob:attacked',
  MOB_DIED = 'mob:died',
  MOB_EXAMINE = 'mob:examine',
  MOB_AGGRO = 'mob:aggro',
  MOB_CHASE_STARTED = 'mob:chase:started',
  MOB_CHASE_ENDED = 'mob:chase:ended',
  MOB_MOVE_REQUEST = 'mob:move:request',
  MOB_DESTROY = 'mob:destroy',

  // Banking System
  BANK_OPEN = 'bank:open',
  BANK_OPEN_REQUEST = 'bank:open_request',
  BANK_CLOSE = 'bank:close',
  BANK_DEPOSIT = 'bank:deposit',
  BANK_DEPOSIT_SUCCESS = 'bank:deposit_success',
  BANK_DEPOSIT_FAIL = 'bank:deposit_fail',
  BANK_DEPOSIT_ALL = 'bank:deposit_all',
  BANK_WITHDRAW = 'bank:withdraw',
  BANK_WITHDRAW_SUCCESS = 'bank:withdraw_success',
  BANK_WITHDRAW_FAIL = 'bank:withdraw_fail',
  BANK_REMOVE = 'bank:remove',
  BANK_CREATE = 'bank:create',

  // Store System
  STORE_OPEN = 'store:open',
  STORE_OPEN_REQUEST = 'store:open_request',
  STORE_CLOSE = 'store:close',
  STORE_BUY = 'store:buy',
  STORE_SELL = 'store:sell',
  STORE_REGISTER_NPC = 'store:register_npc',
  STORE_TRANSACTION = 'store:transaction',
  STORE_PLAYER_COINS = 'store:player_coins',

  // Resource System
  RESOURCE_SPAWNED = 'resource:spawned',
  RESOURCE_GATHER = 'resource:gather',
  RESOURCE_GATHERED = 'resource:gathered',
  RESOURCE_HARVEST = 'resource:harvest',
  RESOURCE_HARVEST_REQUEST = 'resource:harvest_request',
  RESOURCE_DEPLETED = 'resource:depleted',
  RESOURCE_RESPAWNED = 'resource:respawned',
  RESOURCE_GATHERING_STARTED = 'resource:gathering:started',
  RESOURCE_GATHERING_PROGRESS = 'resource:gathering:progress',
  RESOURCE_GATHERING_STOPPED = 'resource:gathering:stopped',
  RESOURCE_VALIDATION_REQUEST = 'resource:validation:request',
  RESOURCE_VALIDATION_COMPLETE = 'resource:validation:complete',
  RESOURCE_PLACEMENT_VALIDATE = 'resource:placement:validate',
  RESOURCE_RESPAWN_READY = 'resource:respawn:ready',
  RESOURCE_GATHERING_COMPLETED = 'resource:gathering:completed',
  RESOURCE_SPAWN_POINTS_REGISTERED = 'resource:spawn_points:registered',
  RESOURCE_MESH_CREATED = 'resource:mesh:created',
  RESOURCE_ACTION = 'resource:action',

  // Skills & XP System
  SKILLS_XP_GAINED = 'skills:xp_gained',
  SKILLS_LEVEL_UP = 'skills:level_up',
  SKILLS_UPDATED = 'skills:updated',
  SKILLS_ACTION = 'skills:action',
  SKILLS_RESET = 'skills:reset',
  SKILLS_MILESTONE = 'skills:milestone',
  TOTAL_LEVEL_CHANGED = 'total:level:changed',

  // Chat System
  CHAT_SEND = 'chat:send',
  CHAT_MESSAGE = 'chat:message',

  // Corpse System
  CORPSE_SPAWNED = 'corpse:spawned',
  CORPSE_CLICK = 'corpse:click',
  CORPSE_LOOT_REQUEST = 'corpse:loot_request',
  CORPSE_CLEANUP = 'corpse:cleanup',
  CORPSE_EMPTY = 'corpse:empty',

  // Fire System
  FIRE_EXTINGUISHED = 'fire:extinguished',
  FIRE_CREATED = 'fire:created',

  // Cooking System
  COOKING_COMPLETED = 'cooking:completed',

  // Processing System
  PROCESSING_FIREMAKING_REQUEST = 'processing:firemaking:request',
  PROCESSING_COOKING_REQUEST = 'processing:cooking:request',

  // Death System
  DEATH_LOOT_COLLECT = 'death:loot:collect',
  DEATH_HEADSTONE_EXPIRED = 'death:headstone:expired',
  PLAYER_SET_DEAD = 'player:set_dead',
  UI_DEATH_SCREEN = 'ui:death_screen',
  UI_DEATH_SCREEN_CLOSE = 'ui:death_screen:close',
  DEATH_LOOT_HEADSTONE = 'death:loot_headstone',
  ENTITY_CREATE_HEADSTONE = 'entity:create_headstone',
  ENTITY_REMOVE = 'entity:remove',
  WORLD_CREATE_GROUND_ITEM = 'world:create_ground_item',

  // AI Navigation System
  AI_NAVIGATION_REQUEST = 'ai:navigation:request',
  AI_AGENT_REGISTER = 'ai:agent:register',
  AI_AGENT_UNREGISTER = 'ai:agent:unregister',
  AI_NAVIGATION_GRID_READY = 'ai:navigation:grid:ready',
  AI_AGENT_UNSTUCK = 'ai:agent:unstuck',

  // Biome Visualization
  BIOME_TOGGLE_VISUALIZATION = 'biome:toggle_visualization',
  BIOME_SHOW_AREA = 'biome:show_area',
  BIOME_HIDE_AREA = 'biome:hide_area',

  // Stats System
  STATS_UPDATE = 'stats:update',

  // Persistence System
  PERSISTENCE_SAVE = 'persistence:save',
  PERSISTENCE_LOAD = 'persistence:load',

  // Chunk System
  CHUNK_LOADED = 'chunk:loaded',
  CHUNK_UNLOADED = 'chunk:unloaded',

  // Pathfinding System
  PATHFINDING_REQUEST = 'pathfinding:request',

  // Physics Test Events
  PHYSICS_TEST_RUN_ALL = 'physics:test:run_all',
  PHYSICS_TEST_BALL_RAMP = 'physics:test:ball_ramp',
  PHYSICS_TEST_CUBE_DROP = 'physics:test:cube_drop',
  PHYSICS_TEST_CHARACTER_COLLISION = 'physics:test:character_collision',
  PHYSICS_PRECISION_RUN_ALL = 'physics:precision:run_all',
  PHYSICS_PRECISION_PROJECTILE = 'physics:precision:projectile',
  PHYSICS_PRECISION_COMPLETED = 'physics:precision:completed',
  PHYSICS_VALIDATION_REQUEST = 'physics:validation:request',
  PHYSICS_VALIDATION_COMPLETE = 'physics:validation:complete',
  PHYSICS_GROUND_CLAMP = 'physics:ground_clamp',
  PHYSICS_REGISTER = 'physics:register',
  PHYSICS_UNREGISTER = 'physics:unregister',

  // General Test Events
  TEST_RUN_ALL = 'test:run_all',
  TEST_PLAYER_REMOVE = 'test:player:remove',
  TEST_BANK_CREATE = 'test:bank:create',
  TEST_BANK_REMOVE = 'test:bank:remove',
  TEST_STORE_CREATE = 'test:store:create',
  TEST_STORE_REMOVE = 'test:store:remove',
  TEST_NPC_CREATE = 'test:npc:create',
  TEST_NPC_REMOVE = 'test:npc:remove',
  TEST_ITEM_CREATE = 'test:item:create',
  TEST_ITEM_REMOVE = 'test:item:remove',
  TEST_TREE_CREATE = 'test:tree:create',
  TEST_TREE_REMOVE = 'test:tree:remove',
  TEST_FISHING_SPOT_CREATE = 'test:fishing_spot:create',
  TEST_FISHING_SPOT_REMOVE = 'test:fishing_spot:remove',
  TEST_FIRE_EXTINGUISH = 'test:fire:extinguish',
  TEST_TEXT_CREATE = 'test:text:create',
  TEST_WAYPOINT_CREATE = 'test:waypoint:create',
  TEST_WAYPOINT_UPDATE = 'test:waypoint:update',
  TEST_WAYPOINT_REMOVE = 'test:waypoint:remove',
  TEST_OBSTACLE_CREATE = 'test:obstacle:create',
  TEST_OBSTACLE_REMOVE = 'test:obstacle:remove',
  TEST_BARRIER_CREATE = 'test:barrier:create',
  TEST_BARRIER_REMOVE = 'test:barrier:remove',
  TEST_TELEPORT_TARGET_CREATE = 'test:teleport_target:create',
  TEST_TELEPORT_TARGET_UPDATE = 'test:teleport_target:update',
  TEST_TELEPORT_TARGET_REMOVE = 'test:teleport_target:remove',
  TEST_EQUIPMENT_RACK_CREATE = 'test:equipment_rack:create',
  TEST_EQUIPMENT_RACK_REMOVE = 'test:equipment_rack:remove',
  TEST_EQUIPMENT_SLOT_CREATE = 'test:equipment_slot:create',
  TEST_EQUIPMENT_SLOT_REMOVE = 'test:equipment_slot:remove',
  TEST_EQUIPMENT_SLOT_UPDATE = 'test:equipment_slot:update',
  TEST_RUN_FIREMAKING_TESTS = 'test:run_firemaking_tests',
  TEST_RUN_COOKING_TESTS = 'test:run_cooking_tests',

  // Test Framework Events
  TEST_STATION_CREATED = 'test:station:created',
  TEST_RESULT = 'test:result',
  TEST_UI_CREATE = 'test:ui:create',
  TEST_ZONE_CREATE = 'test:zone:create',
  TEST_UI_UPDATE = 'test:ui:update',
  TEST_ZONE_UPDATE = 'test:zone:update',
  TEST_PLAYER_CREATE = 'test:player:create',
  TEST_PLAYER_MOVE = 'test:player:move',
  TEST_CLEAR_UI = 'test:clear_ui',
  TEST_ALL_COMPLETED = 'test:all_completed',
  TEST_REPORT = 'test:report',
  TEST_SPAWN_CUBE = 'test:spawn_cube',
  TEST_CLEAR_CUBES = 'test:clear_cubes',
  TEST_RUN_SUITE = 'test:run_suite',

  // Additional UI Events
  UI_CREATE = 'ui:create',
  UI_OPEN_MENU = 'ui:open_menu',
  UI_CLOSE_MENU = 'ui:close_menu',
  UI_CONTEXT_MENU = 'ui:context_menu',
  UI_CLOSE_ALL = 'ui:close_all',
  UI_SET_VIEWPORT = 'ui:set_viewport',
  UI_DRAG_DROP = 'ui:drag_drop',
  UI_BANK_DEPOSIT = 'ui:bank_deposit',
  UI_BANK_WITHDRAW = 'ui:bank_withdraw',
  UI_HEALTH_UPDATE = 'ui:update_health',
  UI_PLAYER_UPDATE = 'ui:player_update',
  UI_EQUIPMENT_UPDATE = 'ui:equipment_update',
  UI_ATTACK_STYLE_GET = 'ui:attack_style:get',
  UI_ATTACK_STYLE_UPDATE = 'ui:attack_style:update',
  UI_ATTACK_STYLE_CHANGED = 'ui:attack_style:changed',
  UI_MESSAGE = 'ui:message',
  UI_REQUEST = 'ui:request',
  UI_CONTEXT_ACTION = 'ui:context_action',
  UI_KEYBOARD_TEST = 'ui:keyboard_test',
  UI_SCREEN_READER_TEST = 'ui:screen_reader_test',
  UI_CONTRAST_TEST = 'ui:contrast_test',
  UI_COMPLEX_INTERACTION = 'ui:complex_interaction',
  UI_INTERACTION_VALIDATION = 'ui:interaction_validation',
  UI_TRIGGER_ERROR = 'ui:trigger_error',
  UI_TEST_RECOVERY = 'ui:test_recovery',
  UI_RESILIENCE_TEST = 'ui:resilience_test',

  // Damage & Healing Events
  PLAYER_DAMAGE_TAKEN = 'player:damage:taken',
  PLAYER_HEALING_RECEIVED = 'player:healing:received',
  ENTITY_DAMAGE_TAKEN = 'entity:damage:taken',
  ENTITY_HEALING_RECEIVED = 'entity:healing:received',
  ENTITY_REVIVED = 'entity:revived',

  // World Events
  WORLD_LOAD_AREA = 'world:load_area',
  WORLD_UNLOAD_AREA = 'world:unload_area',
  WORLD_GENERATE = 'world:generate',
  WORLD_SPAWN_STRUCTURE = 'world:spawn_structure',
  
  // Animation Events
  ANIMATION_COMPLETE = 'animation:complete',
  ANIMATION_PLAY = 'animation:play',
  ANIMATION_CANCEL = 'animation:cancel',
  AVATAR_LOAD_COMPLETE = 'avatar_load_complete',

  // Terrain Events
  TERRAIN_CONFIGURE = 'terrain:configure',
  TERRAIN_SPAWN_RESOURCE = 'terrain:spawn_resource',
  TERRAIN_TILE_UNLOADED = 'terrain:tile:unloaded',
  TERRAIN_GENERATE_INITIAL = 'terrain:generate-initial',
  
  // Character System
  CHARACTER_LIST = 'character:list',
  CHARACTER_CREATED = 'character:created',
  CHARACTER_SELECTED = 'character:selected',
  
  // General Events
  SERVER_CORRECTION = 'serverCorrection',
  ENTITY_MODIFIED = 'entityModified',
  ENTITY_INTERACT_REQUEST = 'entity:interact_request',
  AGGRO_FORCE_TRIGGER = 'aggro:force-trigger',
}

// ============================================================================
// EVENT PAYLOAD INTERFACES
// ============================================================================

// Core Event Payloads
export interface PlayerJoinedPayload {
  playerId: string;
  player: PlayerLocal;
}

export interface PlayerEnterPayload {
  playerId: string;
}

export interface PlayerLeavePayload {
  playerId: string;
}

export interface EntityCreatedPayload {
  entityId: string;
  entity: Entity;
}

export interface PlayerLevelUpPayload {
  playerId: string;
  skill: keyof Skills;
  newLevel: number;
}

export interface PlayerXPGainedPayload {
  playerId: string;
  skill: keyof Skills;
  amount: number;
}

export interface CombatStartedPayload {
  attackerId: string;
  targetId: string;
}

export interface InventoryItemAddedPayload {
  playerId: string;
  item: InventoryItem;
}

export interface MobDiedPayload {
  mobId: string;
  killerId: string;
  loot: InventoryItem[];
}

// Item System Event Payloads
export interface ItemDropPayload {
  item: Item;
  position: Position3D;
  playerId: string;
}

export interface ItemPickupPayload {
  playerId: string;
  itemId: string;
  groundItemId: string;
}

export interface ItemPickupRequestPayload {
  playerId: string;
  itemId: string;
  position: Position3D;
}

export interface ItemDroppedPayload {
  itemId: string;
  item: Item;
  position: Position3D;
  droppedBy: string;
  playerId: string;
}

export interface ItemSpawnedPayload {
  itemId: string;
  position: Position3D;
}

export interface InventoryAddPayload {
  playerId: string;
  item: {
    id: string;
    name: string;
    type: string;
    quantity: number;
    stackable: boolean;
  };
}

export interface UIMessagePayload {
  playerId: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

// Additional Event Payloads
export interface BankDepositEvent {
  playerId: string;
  itemId: string;
  quantity: number;
}

export interface BankWithdrawEvent {
  playerId: string;
  itemId: string;
  quantity: number;
  slotIndex: number;
}

export interface BankDepositSuccessEvent {
  playerId: string;
  itemId: string;
  quantity: number;
  bankId: string;
}

export interface StoreTransactionEvent {
  playerId: string;
  storeId: string;
  itemId: string;
  quantity: number;
  totalCost: number;
  transactionType: 'buy' | 'sell';
}

export interface StoreOpenEvent {
  playerId: string;
  storeId: string;
  playerPosition: Position3D;
}

export interface StoreCloseEvent {
  playerId: string;
  storeId: string;
}

export interface StoreBuyEvent {
  playerId: string;
  storeId: string;
  itemId: string;
  quantity: number;
}

export interface StoreSellEvent {
  playerId: string;
  storeId: string;
  itemId: string;
  quantity: number;
}

export interface InventoryUpdateEvent {
  playerId: string;
  itemId: string;
  previousQuantity: number;
  newQuantity: number;
  action: 'add' | 'remove' | 'update';
}

export interface InventoryAddEvent {
  playerId: string;
  itemId: string;
  quantity: number;
}

export interface InventoryCanAddEvent {
  playerId: string;
  item: {
    id: string;
    name: string;
    quantity: number;
    stackable: boolean;
  };
  callback: (canAdd: boolean) => void;
}

export interface InventoryCheckEvent {
  playerId: string;
  itemId: string;
  quantity: number;
  callback: (hasItem: boolean, inventorySlot: InventoryItemInfo | null) => void;
}

export interface InventoryGetCoinsEvent {
  playerId: string;
  callback: (coins: number) => void;
}

export interface InventoryHasEquippedEvent {
  playerId: string;
  slot: string;
  itemType: string;
  callback: (hasEquipped: boolean) => void;
}

export interface InventoryRemoveCoinsEvent {
  playerId: string;
  amount: number;
}

export interface InventoryRemoveEvent {
  playerId: string;
  itemId: string;
  quantity: number;
}

export interface InventoryItemInfo {
  id: string;
  name: string;
  quantity: number;
  stackable: boolean;
  slot: string | null;
}

export interface PlayerInitEvent {
  playerId: string;
  position: Position3D;
  isNewPlayer: boolean;
}

export interface PlayerEnterEvent {
  playerId: string;
  userId?: string;
}

export interface PlayerLeaveEvent {
  playerId: string;
  userId?: string;
}

export interface PlayerLevelUpEvent {
  playerId: string;
  previousLevel: number;
  newLevel: number;
  skill: string;
}

export interface PlayerXPGainEvent {
  playerId: string;
  skill: string;
  xpGained: number;
  currentXP: number;
  currentLevel: number;
}

export interface HealthUpdateEvent {
  entityId: string;
  previousHealth: number;
  currentHealth: number;
  maxHealth: number;
}

export interface PlayerDeathEvent {
  playerId: string;
  deathLocation: Position3D;
  cause: string;
}

export interface PlayerRespawnRequestEvent {
  playerId: string;
  requestTime: number;
}

export interface PlayerRegisterEvent {
  id: string;
  playerId: string;
  entity: import('../entities/PlayerLocal').PlayerLocal;
}

export interface UIMessageEvent {
  playerId: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration: number;
}

export interface AvatarReadyEvent {
  playerId: string;
  avatar: unknown;
  camHeight: number;
}

export interface PlayerPositionUpdateEvent {
  playerId: string;
  position: { x: number; y: number; z: number };
}

export interface CombatSessionEvent {
  sessionId: string;
  attackerId: string;
  targetId: string;
}

export interface CombatHitEvent {
  sessionId: string;
  attackerId: string;
  targetId: string;
  damage: number;
  hitType: string;
}

export interface ItemSpawnedEvent {
  itemId: string;
  position: { x: number; y: number; z: number };
}

export interface EventData<T = Record<string, unknown>> {
  type: EventType;
  data: T;
  timestamp: number;
  source: string | null;
}

// ============================================================================
// EVENT SYSTEM INTERFACES
// ============================================================================

/**
 * Shared event system types
 */
export interface SystemEvent<T = AnyEvent> {
  readonly type: EventType;
  readonly data: T;
  readonly source: string;
  readonly timestamp: number;
  readonly id: string;
}

export interface EventHandler<T = AnyEvent> {
  (event: SystemEvent<T>): void | Promise<void>;
}

export interface EventSubscription {
  unsubscribe(): void;
  readonly active: boolean;
}

// =========================================================================
// TYPE-SAFE EVENT MAPPING
// =========================================================================

/**
 * Complete mapping of all events to their payload types
 * This ensures type safety when emitting and listening to events
 */
export interface EventMap {
  // Core Events
  [EventType.READY]: void;
  [EventType.ERROR]: { error: Error; message: string };
  [EventType.TICK]: { deltaTime: number };
  [EventType.PLAYER_JOINED]: PlayerJoinedPayload;
  [EventType.PLAYER_LEFT]: PlayerLeavePayload;
  [EventType.PLAYER_CLEANUP]: { playerId: string };

  [EventType.ENTITY_CREATED]: EntityCreatedPayload;
  [EventType.ENTITY_DEATH]: { entityId: string; sourceId?: string; lastDamageTime?: number };
  [EventType.ENTITY_REVIVED]: { entityId: string; newHealth?: number };
  [EventType.ENTITY_UPDATED]: { entityId: string; changes: Record<string, string | number | boolean> };
  [EventType.ASSET_LOADED]: { assetId: string; assetType: string };
  [EventType.ASSETS_LOADING_PROGRESS]: { progress: number; total: number; stage?: string; current?: number };
  [EventType.UI_TOGGLE]: { visible: boolean };
  [EventType.UI_OPEN_PANE]: { pane: string };
  [EventType.UI_CLOSE_PANE]: { pane: string };
  [EventType.UI_MENU]: { action: 'open' | 'close' | 'toggle' | 'navigate' };
  [EventType.UI_AVATAR]: { avatarData: { vrm: string; scale: number; position: { x: number; y: number; z: number } } };
  [EventType.UI_KICK]: { playerId: string; reason: string };
  [EventType.UI_TOAST]: { message: string; type: 'info' | 'success' | 'warning' | 'error' | string };
  [EventType.UI_SIDEBAR_CHAT_TOGGLE]: void;
  [EventType.UI_ACTIONS_UPDATE]: Array<{ id: string; name: string; enabled: boolean; hotkey: string | null }>;
  
  // Camera Events
  [EventType.CAMERA_SET_MODE]: { mode: 'first_person' | 'third_person' | 'top_down' };
  [EventType.CAMERA_SET_TARGET]: { target: { position: { x: number; y: number; z: number } } };
  [EventType.CAMERA_CLICK_WORLD]: { screenPosition: { x: number; y: number }; normalizedPosition: { x: number; y: number }; target: { position?: Position3D } };
  [EventType.CAMERA_FOLLOW_PLAYER]: { playerId: string; entity: { id: string; mesh: object | null }; camHeight: number };
  
  // Inventory Events
  [EventType.INVENTORY_ITEM_REMOVED]: { playerId: string; itemId: string | number; quantity: number; slot?: number };
  [EventType.ITEM_DROP]: { playerId: string; itemId: string; quantity: number; slot?: number };
  [EventType.INVENTORY_USE]: { playerId: string; itemId: string; slot: number };
  [EventType.ITEM_PICKUP]: { playerId: string; itemId?: string; entityId: string; position?: Position3D };
  [EventType.INVENTORY_UPDATE_COINS]: { playerId: string; coins: number };
  [EventType.INVENTORY_MOVE]: { playerId: string; fromSlot?: number; toSlot?: number; sourceSlot?: number; targetSlot?: number };
  [EventType.INVENTORY_DROP_ALL]: { playerId: string; position: { x: number; y: number; z: number } };
  [EventType.INVENTORY_CAN_ADD]: InventoryCanAddEvent;
  [EventType.INVENTORY_REMOVE_COINS]: InventoryRemoveCoinsEvent;
  [EventType.INVENTORY_ITEM_ADDED]: InventoryItemAddedPayload;
  [EventType.INVENTORY_CHECK]: InventoryCheckEvent;
  
  // Player Health & Position Events
  [EventType.PLAYER_HEALTH_UPDATED]: { playerId: string; health: number; maxHealth: number };
  [EventType.PLAYER_TELEPORT_REQUEST]: { playerId: string; position: { x: number; y: number; z: number }; rotationY?: number };
  
  // Camera Events (continued)
  [EventType.CAMERA_TAP]: { x: number; y: number };
  
  // XR Events
  [EventType.XR_SESSION]: XRSession | null;
  
  // Avatar Events
  [EventType.AVATAR_LOAD_COMPLETE]: { playerId: string; success: boolean };
  
  // Input Events
  inputAck: { sequence: number; corrections?: unknown };
  
  // All other events
  [EventType.ENTITY_SPAWNED]: EntitySpawnedEvent;
  [EventType.RESOURCE_SPAWNED]: { id: string; type: string; position: { x: number; y: number; z: number } };
  [EventType.RESOURCE_DEPLETED]: { resourceId: string; position?: { x: number; y: number; z: number } };
  [EventType.RESOURCE_RESPAWNED]: { resourceId: string; position?: { x: number; y: number; z: number } };
  [EventType.RESOURCE_SPAWN_POINTS_REGISTERED]: { spawnPoints: Array<{ id: string; type: string; position: { x: number; y: number; z: number } }> };
  [EventType.RESOURCE_MESH_CREATED]: { mesh: unknown; instanceId: number | null; resourceId: string; resourceType: string; worldPosition: { x: number; y: number; z: number } };
  [EventType.RESOURCE_HARVEST_REQUEST]: { playerId: string; entityId: string; resourceType: string; resourceId: string; harvestSkill: string; requiredLevel: number; harvestTime: number; harvestYield: Array<{ itemId: string; quantity: number; chance: number }> };
  [EventType.ENTITY_HEALTH_CHANGED]: { entityId: string; health: number; maxHealth: number; isDead: boolean };
  [EventType.ENTITY_DAMAGED]: { entityId: string; damage: number; sourceId?: string; remainingHealth: number; isDead: boolean };
  [EventType.ENTITY_HEALED]: { entityId: string; healAmount: number; newHealth: number };
  [EventType.ENTITY_LEVEL_CHANGED]: { entityId: string; newLevel: number };
  [EventType.ENTITY_INTERACTED]: { entityId: string; playerId: string; position: { x: number; y: number; z: number } };
  [EventType.MOB_EXAMINE]: { playerId: string; mobId: string; mobData: unknown };
  [EventType.MOB_AGGRO]: { mobId: string; targetId: string };
  [EventType.MOB_RESPAWNED]: { mobId: string; position: Position3D };
  [EventType.NPC_TRAINER_OPEN]: { playerId: string; npcId: string; skillsOffered: string[] };
  [EventType.NPC_QUEST_OPEN]: { playerId: string; npcId: string; questsAvailable: string[] };
  [EventType.BANK_OPEN_REQUEST]: { playerId: string; npcId: string };
  [EventType.STORE_OPEN_REQUEST]: { playerId: string; npcId: string; inventory: unknown[] };
  [EventType.CORPSE_EMPTY]: { corpseId: string };
  [EventType.CHARACTER_LIST]: { characters: Array<{ id: string; name: string; level?: number; lastLocation?: { x: number; y: number; z: number } }> };
  [EventType.CHARACTER_CREATED]: { id: string; name: string };
  [EventType.CHARACTER_SELECTED]: { characterId: string | null };
  [EventType.ENTITY_MODIFIED]: { id: string; changes: Record<string, unknown> };
  [EventType.SERVER_CORRECTION]: { sequence: number; corrections: unknown };
  [EventType.TERRAIN_TILE_UNLOADED]: { tileId: string };
  [EventType.TERRAIN_GENERATE_INITIAL]: { centerX: number; centerZ: number; radius: number };
  [EventType.ENTITY_INTERACT_REQUEST]: { playerId: string; entityId: string; interactionType: string; playerPosition?: Position3D };
  [EventType.AGGRO_FORCE_TRIGGER]: { playerId: string };
}

/**
 * Type-safe event emitter interface
 */
export interface TypedEventEmitter {
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
  on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): void;
  off<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): void;
  once<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): void;
}

// Generic event base type
export type AnyEvent = Record<string, unknown>

/**
 * Event payloads type map
 */
export type EventPayloads = {
  [EventType.PLAYER_JOINED]: PlayerJoinedPayload
  [EventType.ENTITY_CREATED]: EntityCreatedPayload
  [EventType.PLAYER_LEVEL_UP]: PlayerLevelUpPayload
  [EventType.PLAYER_XP_GAINED]: PlayerXPGainedPayload
  [EventType.COMBAT_STARTED]: CombatStartedPayload
  [EventType.INVENTORY_ITEM_ADDED]: InventoryItemAddedPayload
  [EventType.MOB_DIED]: MobDiedPayload
}

/**
 * Helper type to extract event payload type
 */
export type EventPayload<K extends keyof EventMap> = EventMap[K];

/**
 * Helper type to ensure event name is valid
 */
export type ValidEventName = keyof EventMap;

/**
 * Helper function to create a typed event payload
 */
export function createEventPayload<K extends keyof EventMap>(
  event: K,
  data: EventMap[K]
): { event: K; data: EventMap[K] } {
  return { event, data };
}
