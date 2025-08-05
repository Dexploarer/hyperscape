/**
 * Core RPG types
 * These types are specific to the RPG game systems
 */

import * as THREE from '../../core/extras/three'
import type { System, SystemDependencies } from '../../core/systems/System'
import type { World } from '../../core/World'
import { EntityData } from '../../types/index'
import type { RPGPlayerRow } from './database'
import type { HeadstoneData, ItemRarity, MobType } from './entities'

// Re-export types for RPG components
export type { World }
export { ItemRarity } from './entities'

// RPG Component data map - strongly typed, no optionals
export interface RPGComponentDataMap {
  transform: {
    position: [number, number, number]
    quaternion: [number, number, number, number]
    scale: [number, number, number]
  }
  physics: {
    type: 'static' | 'kinematic' | 'dynamic'
    mass: number
    friction: number
    restitution: number
  }
  health: {
    current: number
    maximum: number
  }
  inventory: {
    items: Array<{
      id: string
      itemId: string
      quantity: number
      slot: number
    }>
    capacity: number
  }
  combat: {
    attackLevel: number
    strengthLevel: number
    defenseLevel: number
    constitutionLevel: number
    rangeLevel: number
    inCombat: boolean
    target: string | null
  }
  skills: {
    woodcutting: number
    fishing: number
    firemaking: number
    cooking: number
  }
}

// Skill structure with level and experience
export interface SkillData {
  level: number
  xp: number
}

// Complete skills set
export interface PlayerSkills {
  attack: SkillData
  strength: SkillData
  defense: SkillData
  constitution: SkillData
  ranged: SkillData
  woodcutting: SkillData
  fishing: SkillData
  firemaking: SkillData
  cooking: SkillData
}

// RPG Entity data extends core EntityData
export interface RPGEntityData extends EntityData {
  components: Partial<RPGComponentDataMap>
  userData: {
    rpgData: {
      playerId: string
      characterName: string
      level: number
      experience: number
    }
  }
  // RPG-specific properties
  health: number
}

/**
 * Inventory Item Types
 * 
 * InventoryItem: Represents an item instance in a player's inventory
 * - References the base item definition via itemId
 * - Tracks quantity and slot position
 * - Can have instance-specific metadata (e.g., durability)
 * 
 * RPGItem: The base item definition (defined below)
 * - Contains all the static properties of an item type
 * - Shared across all instances of that item
 * 
 * Usage example:
 * ```typescript
 * const inventoryItem: InventoryItem = {
 *   id: "inv_12345",
 *   itemId: "bronze_sword",
 *   quantity: 1,
 *   slot: 0
 * }
 * const itemDef = getItem(inventoryItem.itemId) // Returns RPGItem
 * ```
 */
export interface InventoryItem {
  id: string              // Unique instance ID (e.g., for unstackable items)
  itemId: string          // Reference to the base RPGItem
  quantity: number        // How many of this item
  slot: number            // Inventory slot position
  metadata: Record<string, number | string | boolean> | null  // Instance-specific data (e.g., durability, enchantments)
}

export interface Inventory {
  items: InventoryItem[]
  capacity: number
  coins: number
}

// Inventory item with full item data (used by RPGInventorySystem)
export interface RPGInventorySlotItem {
  slot: number;
  itemId: string;
  quantity: number;
  item: RPGItem;
}

export interface RPGPlayerInventory {
  playerId: string;
  items: RPGInventorySlotItem[];
  coins: number;
}

// Removed type alias - use InventoryItem directly

// Equipment slot type enum - use this consistently
export enum EquipmentSlotName {
  WEAPON = 'weapon',
  SHIELD = 'shield',
  HELMET = 'helmet',
  BODY = 'body',
  LEGS = 'legs',
  BOOTS = 'boots',
  GLOVES = 'gloves',
  CAPE = 'cape',
  AMULET = 'amulet',
  RING = 'ring',
  ARROWS = 'arrows',
}

// Type alias for equipment slot values - use this for type safety
export type EquipmentSlotType = `${EquipmentSlotName}`;

export interface EquipmentSlot {
  id: string
  name: string
  slot: EquipmentSlotName
  itemId: string | number | null
  item: RPGItem | null
  visualMesh?: THREE.Object3D
}

export interface Equipment {
  weapon: EquipmentSlot | null
  shield: EquipmentSlot | null
  helmet: EquipmentSlot | null
  body: EquipmentSlot | null
  legs: EquipmentSlot | null
  arrows: EquipmentSlot | null
}

// World Generation types
export interface Town {
  id: string;
  name: string;
  position: { x: number; y: number; z: number }
  safeZoneRadius: number;
  hasBank: boolean;
  hasStore: boolean;
  isRespawnPoint: boolean;
}

// World Content types
export interface NPCEntity {
  id: string;
  npc: NPCLocation;
  mesh: THREE.Object3D;
  area: WorldArea;
}

export interface ResourceEntity {
  id: string;
  resource: BiomeResource;
  mesh: THREE.Object3D;
  area: WorldArea;
  respawnTime: number;
  isActive: boolean;
}

export interface MobEntity {
  id: string;
  mobData: RPGMobData;
  mesh: THREE.Object3D;
  area: WorldArea;
  spawnPoint: MobSpawnPoint;
  currentHealth: number;
  lastRespawn: number;
  isAlive: boolean;
  homePosition: { x: number; y: number; z: number };
}

export interface WorldChunk {
  id: string;
  bounds: { minX: number, maxX: number, minZ: number, maxZ: number };
  area: WorldArea;
  npcs: NPCEntity[];
  resources: ResourceEntity[];
  mobs: MobEntity[];
  terrainMesh?: THREE.Object3D;
  isLoaded: boolean;
}

// RPG-specific world chunk for persistence
export interface RPGWorldChunk {
  id: string;
  chunkX: number;
  chunkZ: number;
  data: Record<string, unknown>;
  lastActivity: Date;
  playerCount: number;
  needsReset: boolean;
  // properties for detailed chunk data
  biome: string;
  heightData: number[];
  resourceStates: Record<string, boolean>;
  mobSpawnStates: Record<string, MobSpawnPoint>;
  playerModifications: Record<string, unknown>;
  chunkSeed: number;
  lastActiveTime: Date;
}

// UI types
export interface UIState {
  playerId: string;
  health: { current: number; max: number };
  skills: PlayerSkills;
  inventory: Inventory;
  equipment: Equipment;
  combatLevel: number;
  inCombat: boolean;
  minimapData: { position: Position3D };
}

// Testing Framework types
export interface TestStation {
  id: string;
  name: string;
  position: Position3D;
  status: 'idle' | 'running' | 'passed' | 'failed';
  lastRunTime: number;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  currentError: string | null;
  timeoutMs: number;
  ui: THREE.Object3D | null; // UI element for floating name
  testZone: THREE.Object3D | null; // Visual zone indicator
  isStarting: boolean; // Flag to prevent multiple starts
}

export interface TestResult {
  success: boolean;
  error: string | null;
  duration: number;
  details: Record<string, string | number | boolean> | null;
}

// Specific test data types

export interface WoodcuttingTestData {
  treeId: string;
  toolUsed: string;
  logsReceived: number;
  xpGained: number;
  skillLevelBefore: number;
  skillLevelAfter: number;
  duration: number;
  success: boolean;
}

export interface CombatTestData {
  attackerId: string;
  targetId: string;
  damageDealt: number;
  hitAccuracy: number;
  combatStyle: CombatStyle;
  attackType: AttackType;
  roundsCompleted: number;
  targetKilled: boolean;
  xpGained: number;
}

export interface MovementTestData {
  startPosition: Position3D;
  endPosition: Position3D;
  pathLength: number;
  pathNodes: number;
  obstaclesAvoided: number;
  duration: number;
  averageSpeed: number;
  success: boolean;
}

export interface VisualTestData {
  entitiesRendered: number;
  colorAccuracy: number;
  positionAccuracy: number;
  interactionSuccess: boolean;
}

// RPG Test Runner types
export interface RPGTestResult {
  testName: string;
  systemName: string;
  passed: boolean;
  error: string | null;
  duration: number;
  timestamp: number;
  data: WoodcuttingTestData | CombatTestData | MovementTestData | VisualTestData | null;
}

export interface RPGTestSuite {
  name: string;
  tests: RPGTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  successRate: number;
}

export interface VisualTestEntity {
  id: string;
  type: 'player' | 'mob' | 'item' | 'resource' | 'npc';
  mesh: THREE.Mesh;
  cube: THREE.Mesh; // Same as mesh but with clearer name for cube reference
  position: { x: number; y: number; z: number }
  color: number;
  label?: string;
}

export interface CombatData {
  attackerId: string
  targetId: string
  attackerType: 'player' | 'mob'
  targetType: 'player' | 'mob'
  startTime: number
  lastAttackTime: number
  combatStyle: CombatStyle | null
}

// Movement types
export interface MovementComponent {
  position: Position3D
  velocity: THREE.Vector3
  targetPosition: Position3D | null
  destination: Position3D | null
  speed: number
  movementSpeed: number
  isMoving: boolean
  path: Position3D[]
  pathNodes: Position3D[]
  currentPathIndex: number
  lastMovementTime: number
}

// Component interfaces for ECS system
export interface InventoryComponent {
  items: InventoryItem[]
  capacity: number
  coins: number
}

export interface StatsComponent {
  combatLevel: number
  level: number
  health: number
  maxHealth: number
  attack: SkillData
  strength: SkillData
  defense: SkillData
  constitution: SkillData
  ranged: SkillData
  magic: SkillData
  prayer: { level: number; points: number }
  woodcutting: SkillData
  fishing: SkillData
  firemaking: SkillData
  cooking: SkillData
  activePrayers: PrayerComponent
  equipment: EquipmentComponent
  equippedSpell: string | null
  effects: { onSlayerTask: boolean; targetIsDragon: boolean; targetMagicLevel: number }
  combatBonuses: CombatBonuses
}



export interface NPCComponent {
  behavior: NPCBehavior
  state: NPCState
  currentTarget: string | null
  spawnPoint: Position3D
  wanderRadius: number
  aggroRange: number
  isHostile: boolean
  combatLevel: number
  aggressionLevel: number
  dialogueLines: string[]
  dialogue: string | null
  services: string[]
}

export interface CombatStateData {
  isInCombat: boolean;
  target: string | null;
  lastAttackTime: number;
  attackCooldown: number;
  damage: number;
  range: number;
}

export interface PrayerComponent {
  protectFromMelee: boolean
  protectFromRanged: boolean
  protectFromMagic: boolean
  // Melee strength prayers
  piety: boolean
  chivalry: boolean
  ultimateStrength: boolean
  superhumanStrength: boolean
  burstOfStrength: boolean
  // Ranged strength prayers
  rigour: boolean
  eagleEye: boolean
  hawkEye: boolean
  sharpEye: boolean
  // Magic damage prayers
  augury: boolean
  mysticMight: boolean
  mysticLore: boolean
  mysticWill: boolean
}

export interface EquipmentComponent {
  weapon: EquipmentSlot | null
  shield: EquipmentSlot | null
  helmet: EquipmentSlot | null
  body: EquipmentSlot | null
  legs: EquipmentSlot | null
  boots: EquipmentSlot | null
  gloves: EquipmentSlot | null
  cape: EquipmentSlot | null
  amulet: EquipmentSlot | null
  ring: EquipmentSlot | null
}

// Mob types
export interface RPGMob {
  id: string
  name: string
  type: MobType | string
  level: number
  position: Position3D
  health: number
  maxHealth: number
  isAlive: boolean
  lootTable: string[]
  respawnTime: number
  aggroRange: number
}

// NPC types
export interface RPGNPC {
  id: string
  name: string
  type: string
  position: Position3D
  dialogue: string[]
  shopItems: string[]
  questIds: string[]
}

// Item types
export interface RPGItem {
  id: string                    // Unique item ID (e.g., "bronze_sword", "cooked_fish")
  name: string                  // Display name
  type: ItemType               // Item category
  quantity: number            // Quantity of the item
  stackable: boolean           // Can stack in inventory
  maxStackSize: number        // Max stack size (999 for stackable, 1 for non-stackable)
  value: number                // Base value in coins
  weight: number              // Item weight
  
  // Equipment properties
  equipSlot: EquipmentSlotName | null           // Equipment slot (weapon, shield, helmet, etc.)
  weaponType: WeaponType | null      // Type of weapon (if applicable)
  equipable: boolean          // Can be equipped
  attackType: AttackType | null      // Type of attack (melee, ranged, magic)
  
  // Item properties
  description: string         // Item description
  examine: string             // Examine text
  tradeable: boolean          // Can be traded
  rarity: ItemRarity              // ItemRarity tier
  
  // Visual assets
  modelPath: string           // 3D model path
  iconPath: string            // UI icon path
  
  // Consumable properties
  healAmount: number          // Health restored (0 if not consumable)
  
  // Combat stats (for equipment)
  stats: {
    attack: number
    defense: number
    strength: number
  }
  
  // Combat bonuses (for equipment)
  bonuses: CombatBonuses
  
  // Requirements to use/equip
  requirements: {
    level: number
    skills: Partial<Record<keyof PlayerSkills, number>>
  }
}

// Resource types
export interface RPGResource {
  id: string
  type: 'tree' | 'fishing_spot' | 'ore' | 'herb_patch' | 'mine'
  name: string
  position: Position3D
  skillRequired: string
  levelRequired: number
  toolRequired: string // Tool item ID
  respawnTime: number // Milliseconds
  isAvailable: boolean
  lastDepleted: number
  drops: Array<{
    itemId: string
    quantity: number
    chance: number // 0-1
  }>
}

export interface RPGResourceDrop {
  itemId: string
  itemName: string
  quantity: number
  chance: number // 0-1
  xpAmount: number
  stackable: boolean
}

export type RPGStoreItemCategory = 'tools' | 'ammunition' | 'consumables' | 'weapons' | 'armor'

// Store types
export interface RPGStoreItem {
  id: string
  itemId: string
  name: string
  price: number
  description: string
  category: RPGStoreItemCategory
  stockQuantity: number // -1 for unlimited
  restockTime: number // 0 for no restock
}

export interface RPGStore {
  id: string
  name: string
  position: Position3D
  items: RPGStoreItem[]
  npcName: string
  buyback: boolean
  buybackRate: number // 0-1 percentage
}

// Bank types
export interface RPGBank {
  id: string
  name: string
  position: Position3D
  capacity: number
}

// Processing types (firemaking and cooking)
export interface RPGFire {
  id: string
  position: Position3D
  playerId: string // Who lit the fire
  createdAt: number
  duration: number // How long fire lasts in milliseconds
  isActive: boolean
  mesh?: THREE.Object3D
}

export interface RPGProcessingAction {
  playerId: string
  actionType: 'firemaking' | 'cooking'
  primaryItem: { id: number; slot: number } // Item being used (tinderbox/raw fish)
  targetItem?: { id: number; slot: number } // Target item (logs/fire)
  targetFire?: string // Fire ID for cooking
  startTime: number
  duration: number
  xpReward: number
  skillRequired: string
}

// Death/Respawn types
export interface RPGDeathData {
  playerId: string
  deathLocation: Position3D
  killedBy: string
  deathTime: number
  respawnTime: number
  itemsDropped?: string[]
}

// Interaction types
export interface InteractableEntity {
  id: string
  type: 'mob' | 'npc' | 'resource' | 'item' | 'store' | 'bank' | 'other'
  name: string
  position: Position3D
  interactionDistance: number
  actions?: string[]
}

// UI types
export interface DamageNumber {
  id: string
  value: number
  type: 'damage' | 'heal' | 'xp' | 'miss'
  position: Position3D
  timestamp: number
}

// Animation system types
export interface AnimationTask {
  id: string
  entityId: string
  targetId?: string
  animationName: string
  duration: number
  attackType: AttackType
  style: CombatStyle
  damage?: number
  startTime: number
  progress: number
  cancelled?: boolean
}

// Dialogue system types
export interface DialogueSession {
  playerId: string
  npcId: string
  currentNode: string
  startTime: number
  variables: Map<string, unknown>
}

export interface DialogueNode {
  id: string
  text: string
  options?: DialogueOption[]
  action?: () => void
  condition?: () => boolean
}

export interface DialogueOption {
  text: string
  nextNode: string
  condition?: () => boolean
  action?: () => void
}

// Spawning system types
export interface SpawnPoint {
  id: string
  position: Position3D
  npcId: number
  maxCount: number
  respawnTime: number
  radius: number
  active: boolean
  currentCount: number
  lastSpawnTime: number
}

export interface RespawnTask {
  spawnerId: string
  npcId: number
  respawnTime: number
  scheduledTime: number
}

export interface Spawner {
  id: string
  position: Position3D
  conditions?: SpawnConditions
  activationRange: number
}

export interface SpawnConditions {
  // Time-based conditions
  timeOfDay?: {
    start: number  // 0-24
    end: number
  }
  
  // Player conditions
  minPlayers?: number
  maxPlayers?: number
  playerLevel?: {
    min: number
    max: number
  }
  
  // Custom conditions
  customCondition?: (spawner: Spawner, world: World) => boolean
}

export interface MeshUserData {
  entityId: string;
  type: 'mob' | 'npc' | 'resource' | 'item' | 'player' | 'static';
  name: string;
  interactable: boolean;
  interactionDistance?: number;
  interactionType?: string;
  mobData: {
    id: string;
    name: string;
    type: string;
    level: number;
    health: number;
    maxHealth: number;
  } | null;
  itemData?: {
    id?: string;
    itemId?: string;
    name?: string;
    type?: string;
    quantity?: number;
    [key: string]: unknown;
  };
}

// Mob entity data for getMobData method
export interface MobEntityData {
  id: string;
  name: string;
  type: MobType | string;
  level: number;
  health: number;
  maxHealth: number;
  attackPower: number;
  defense: number;
  xpReward: number;
  aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'dead';
  targetPlayerId: string | null;
  spawnPoint: Position3D;
  position: Position3D;
}

// AI and combat types
export type MobAIStateType = 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'dead' | 'combat' | 'returning';

export interface MobAIStateData {
  mobId: string
  type: MobType | string
  state: MobAIStateType
  targetId: string | null
  lastStateChange: number
  patrolPath: Position3D[]
  patrolIndex: number
  behavior: 'aggressive' | 'passive'
  lastAction: number
  isInCombat: boolean
  currentTarget: string | null
  aggroTargets: Map<string, AggroTarget>
  combatCooldown: number
  lastAttack: number
  homePosition: Position3D
  currentPosition: Position3D
  isPatrolling: boolean
  isChasing: boolean
  detectionRange: number
  leashRange: number
  chaseSpeed: number
  patrolRadius: number
  patrolTarget: Position3D | null
  combatTarget: CombatTarget | null
  levelIgnore: number
}

// Alias for backwards compatibility
export type RPGAggroAIState = MobAIStateData

export interface AggroTarget {
  playerId: string
  aggroLevel: number
  lastDamageTime: number
  lastSeen: number
  distance: number
  inRange: boolean
}

export interface CombatTarget {
  entityId: string
  entityType: 'player' | 'mob'
  distance: number
  playerId: string
  threat: number
  position: Position3D
  lastSeen: number
}

// World interface moved to rpg-system-types.ts to avoid conflicts
// Use the one from rpg-system-types.ts which is more complete

// World initialization configuration interface
export interface WorldInitConfig {
  seed?: number;
  config?: {
    terrain?: Record<string, {
      enabled?: boolean;
      scale?: number;
      octaves?: number;
      persistence?: number;
      lacunarity?: number;
      amplitude?: number;
      [key: string]: unknown;
    }>;
    biomes?: Record<string, {
      enabled?: boolean;
      temperature?: number;
      humidity?: number;
      elevation?: number;
      resources?: string[];
      [key: string]: unknown;
    }>;
    structures?: Record<string, {
      enabled?: boolean;
      frequency?: number;
      minDistance?: number;
      maxDistance?: number;
      [key: string]: unknown;
    }>;
  };
}

// Resource node data interface for world systems
export interface ResourceNodeData {
  type: 'tree' | 'fishing_spot' | 'ore_vein';
  position: Position3D;
  resourceType: string;
  id: string;
}

// Type for THREE.Mesh with properly typed userData
export interface ResourceMesh extends THREE.Mesh {
  userData: {
    entityId: string;
    type: 'mob' | 'npc' | 'resource' | 'item' | 'player' | 'static';
    name: string;
    interactable: boolean;
    mobData: {
      id: string;
      name: string;
      type: string;
      level: number;
      health: number;
      maxHealth: number;
    } | null;
    entityType: string;
    resourceType: string;
  };
}

// System configuration interface
export interface RPGSystemConfig {
  name: string;
  dependencies: SystemDependencies;
  autoCleanup: boolean;
}

// Player spawn data interface
export interface PlayerSpawnData {
  playerId: string;
  position: THREE.Vector3;
  spawnTime: number;
  hasStarterEquipment: boolean;
  aggroTriggered: boolean;
}

// Loot table interface
export interface LootTable {
  id: string
  mobType: MobType | string
  guaranteedDrops: LootEntry[]
  commonDrops: LootEntry[]
  uncommonDrops: LootEntry[]
  rareDrops: LootEntry[]
  drops?: RPGItem[]
  rareDropTable?: boolean
}

/**
 * Single Authoritative Player Data Structure
 * Replaces all duplicate player data interfaces across the codebase
 */

// Core position and health structures
export interface PlayerPosition {
  x: number
  y: number
  z: number
}

export interface PlayerHealth {
  current: number
  max: number
}

// Complete equipment structure for players
export interface PlayerEquipment {
  weapon: RPGItem | null
  shield: RPGItem | null
  helmet: RPGItem | null
  body: RPGItem | null
  legs: RPGItem | null
  arrows: RPGItem | null
}

// Combat and status
export interface PlayerCombatData {
  combatLevel: number
  combatStyle: 'attack' | 'strength' | 'defense' | 'ranged'
  inCombat: boolean
  combatTarget: string | null
}

// Stamina system
export interface PlayerStamina {
  current: number
  max: number
}

// Death and respawn
export interface PlayerDeathData {
  deathLocation: PlayerPosition | null
  respawnTime: number
}

/**
 * SINGLE AUTHORITATIVE PLAYER DATA INTERFACE
 * This replaces ALL other player data interfaces in the codebase
 */
export interface PlayerData {
  // Core identity
  id: string
  hyperscapePlayerId: string
  name: string

  // Health and status
  health: PlayerHealth
  alive: boolean
  stamina: PlayerStamina

  // Position and movement
  position: PlayerPosition

  // Progression
  skills: PlayerSkills

  // Equipment and inventory
  equipment: PlayerEquipment
  coins: number

  // Combat
  combat: PlayerCombatData

  // Death system
  death: PlayerDeathData

  // Session metadata
  lastAction: string | null
  lastSaveTime: number
  sessionId: string | null
}

/**
 * Migration utilities to convert from old interfaces
 */
export class PlayerDataMigration {
  /**
   * Convert from old RPGPlayerRow to new PlayerData
   */
  static fromRPGPlayerRow(old: RPGPlayerRow, hyperscapePlayerId: string): PlayerData {
    return {
      id: old.playerId,
      hyperscapePlayerId,
      name: old.name,
      health: { current: old.health, max: old.maxHealth },
      alive: old.health > 0,
      stamina: { current: 100, max: 100 }, // Assuming default stamina
      position: { x: old.positionX, y: old.positionY, z: old.positionZ },
      skills: {
        attack: { level: old.attackLevel, xp: old.attackXp },
        strength: { level: old.strengthLevel, xp: old.strengthXp },
        defense: { level: old.defenseLevel, xp: old.defenseXp },
        constitution: { level: old.constitutionLevel, xp: old.constitutionXp },
        ranged: { level: old.rangedLevel, xp: old.rangedXp },
        woodcutting: { level: old.woodcuttingLevel || 1, xp: old.woodcuttingXp || 0 },
        fishing: { level: old.fishingLevel || 1, xp: old.fishingXp || 0 },
        firemaking: { level: old.firemakingLevel || 1, xp: old.firemakingXp || 0 },
        cooking: { level: old.cookingLevel || 1, xp: old.cookingXp || 0 },
      },
      equipment: {
        weapon: null,
        shield: null,
        helmet: null,
        body: null,
        legs: null,
        arrows: null
      },
      coins: old.coins,
      combat: {
        combatLevel: old.combatLevel,
        combatStyle: 'attack',
        inCombat: false,
        combatTarget: null
      },
      death: {
        deathLocation: null,
        respawnTime: 0
      },
      lastAction: null,
      lastSaveTime: old.lastLogin,
      sessionId: null
    }
  }

  /**
   * Convert from old PlayerState to new PlayerData
   */
  static fromPlayerState(old: {
    id?: string;
    name?: string;
    position?: { x: number; y: number; z: number };
    health?: { current: number; max: number };
    skills?: PlayerSkills;
    equipment?: Record<string, RPGItem>;
    combatLevel?: number;
    inCombat?: boolean;
    combatTarget?: string;
    coins?: number;
    deathLocation?: { x: number; y: number; z: number };
    lastAction?: string;
  }): Partial<PlayerData> {
    const partialData: Partial<PlayerData> = {
      id: old.id,
      name: old.name,
      position: old.position,
      health: old.health,
      skills: old.skills,
      equipment: old.equipment ? {
        weapon: null,
        shield: null,
        helmet: null,
        body: null,
        legs: null,
        arrows: null
      } : undefined,
      combat: {
        combatLevel: old.combatLevel || 1,
        combatStyle: 'attack',
        inCombat: old.inCombat || false,
        combatTarget: old.combatTarget || null
      },
      coins: old.coins,
      death: {
        deathLocation: old.deathLocation || null,
        respawnTime: 0
      },
      lastAction: old.lastAction || null,
    }
    return partialData
  }

  /**
   * Get default starting skills
   */
  static getDefaultSkills(): PlayerSkills {
    const defaultSkill = { level: 1, xp: 0 }
    return {
      attack: defaultSkill,
      strength: defaultSkill,
      defense: defaultSkill,
      constitution: defaultSkill,
      ranged: defaultSkill,
      woodcutting: defaultSkill,
      fishing: defaultSkill,
      firemaking: defaultSkill,
      cooking: defaultSkill,
    }
  }

  /**
   * Calculate combat level from skills
   */
  static calculateCombatLevel(skills: PlayerSkills): number {
    const attack = skills.attack?.level || 1
    const strength = skills.strength?.level || 1
    const defense = skills.defense?.level || 1
    const constitution = skills.constitution?.level || 1
    const ranged = skills.ranged?.level || 1

    return Math.floor((attack + strength + defense + constitution + ranged) / 5)
  }

  /**
   * Create a new player with default values
   */
  static createNewPlayer(id: string, hyperscapePlayerId: string, name: string): PlayerData {
    const skills = this.getDefaultSkills()
    return {
      id,
      hyperscapePlayerId,
      name,
      health: { current: 100, max: 100 },
      alive: true,
      stamina: { current: 100, max: 100 },
      position: { x: 0, y: 0, z: 0 },
      skills,
      equipment: {
        weapon: null,
        shield: null,
        helmet: null,
        body: null,
        legs: null,
        arrows: null
      },
      coins: 0,
      combat: {
        combatLevel: 1,
        combatStyle: 'attack',
        inCombat: false,
        combatTarget: null
      },
      death: {
        deathLocation: null,
        respawnTime: 0
      },
      lastAction: null,
      lastSaveTime: Date.now(),
      sessionId: null
    }
  }
}

// Type guard to check if object is PlayerData
export function isPlayerData(obj: unknown): obj is PlayerData {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const candidate = obj as Record<string, unknown>;
  
  return !!(
    'id' in candidate && typeof candidate.id === 'string' &&
    'hyperscapePlayerId' in candidate && typeof candidate.hyperscapePlayerId === 'string' &&
    'name' in candidate && typeof candidate.name === 'string' &&
    'health' in candidate && candidate.health &&
    'position' in candidate && candidate.position &&
    'skills' in candidate && candidate.skills &&
    'equipment' in candidate && candidate.equipment &&
    'combat' in candidate && candidate.combat
  );
}

// Combat and attack style interfaces
export interface AttackStyle {
  id: string;
  name: string;
  description: string;
  xpDistribution: {
    attack: number;
    strength: number;
    defense: number;
    constitution: number;
  };
  damageModifier: number; // Multiplier for damage calculation
  accuracyModifier: number; // Multiplier for hit chance
  icon: string;
}

export interface PlayerAttackStyleState {
  playerId: string;
  selectedStyle: string;
  lastStyleChange: number;
  combatStyleHistory: Array<{
    style: string;
    timestamp: number;
    combatSession: string;
  }>;
}

// Authentication interfaces
export interface RPGPlayerIdentity {
  // Core Hyperscape identity
  hyperscapeUserId: string;
  hyperscapeUserName: string;
  hyperscapeUserRoles: string[];
  
  // RPG-specific identity
  rpgPlayerId: string;
  rpgPlayerName: string;
  clientMachineId: string;
  
  // Authentication tokens
  hyperscapeJwtToken?: string;
  clientPersistentToken: string;
  
  // Session info
  sessionId: string;
  loginTime: Date;
  lastActivity: Date;
  isGuest: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  identity?: RPGPlayerIdentity;
  error?: string;
  isNewPlayer: boolean;
  isReturningPlayer: boolean;
}

// Banking interfaces (updated RPGBankItem to use string id)
export interface RPGBankData {
  items: RPGBankItem[];
  maxSlots: number; // Unlimited per GDD, but we'll use a high number
}

/**
 * Common types shared across RPG systems
 */

// Import types for use in this file
import type {
  Position3D as _Position3D
} from '../../types/index'

// Banking types
export interface RPGBankItem {
  id: string
  name: string
  quantity: number
  stackable: boolean
}

// Re-export common types from main index to avoid duplication
export type {
  Bounds2D, Bounds3D, Color,
  ColorHex, Duration, Position2D, Position3D, Range, Rotation3D, Timestamp, Transform3D, Vector2D, Vector3D
} from '../../types/index'

// Type aliases for internal use
type Position3D = _Position3D

// Item related enums
export enum WeaponType {
  SWORD = 'sword',
  AXE = 'axe',
  MACE = 'mace',
  DAGGER = 'dagger',
  SPEAR = 'spear',
  BOW = 'bow',
  CROSSBOW = 'crossbow',
  STAFF = 'staff',
  WAND = 'wand',
  SHIELD = 'shield',
  SCIMITAR = 'scimitar',
  HALBERD = 'halberd',
  NONE = 'none'
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  FOOD = 'food',
  RESOURCE = 'resource',
  TOOL = 'tool',
  MISC = 'misc',
  CURRENCY = 'currency',
  CONSUMABLE = 'consumable',
  AMMUNITION = 'ammunition'
}


// Combat related enums
export enum CombatStyle {
  AGGRESSIVE = 'aggressive',
  CONTROLLED = 'controlled',
  DEFENSIVE = 'defensive',
  ACCURATE = 'accurate',
  LONGRANGE = 'longrange'
}

export enum AttackType {
  MELEE = 'melee',
  RANGED = 'ranged',
  MAGIC = 'magic'
}

// Simple item bonuses interface for equipment
export interface ItemBonuses {
  attack?: number;
  defense?: number;
  ranged?: number;
  strength?: number;
}

// Combat bonuses interface
export interface CombatBonuses {
  // Simple bonuses for backward compatibility
  attack?: number
  defense?: number
  ranged?: number
  strength?: number
  
  // Detailed combat bonuses
  attackStab?: number
  attackSlash?: number
  attackCrush?: number
  attackRanged?: number
  attackMagic?: number
  defenseStab?: number
  defenseSlash?: number
  defenseCrush?: number
  defenseRanged?: number
  defenseMagic?: number
  meleeStrength?: number
  rangedStrength?: number
  magicDamage?: number
  prayer?: number
  prayerBonus?: number
}

// RPG Player stats interface for UI
export interface RPGPlayerStats {
  level: number
  health: PlayerHealth
  skills: PlayerSkills
  combatLevel: number
  equipment: PlayerEquipment
  inCombat: boolean
}

// Item stats interface
export interface ItemStats {
  attackStab?: number
  attackSlash?: number
  attackCrush?: number
  attackRanged?: number
  attackMagic?: number
  defenseStab?: number
  defenseSlash?: number
  defenseCrush?: number
  defenseRanged?: number
  defenseMagic?: number
  strength?: number
  prayer?: number
  weight?: number
}



// Type alias for compatibility
export type RPGSkills = PlayerSkills
export type RPGPlayer = PlayerData

// NPC related enums
export enum NPCBehavior {
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  PASSIVE = 'passive',
  FRIENDLY = 'friendly',
  PATROL = 'patrol',
  WANDER = 'wander'
}

export enum NPCState {
  IDLE = 'idle',
  WANDERING = 'wandering',
  CHASING = 'chasing',
  COMBAT = 'combat',
  ATTACKING = 'attacking',
  FLEEING = 'fleeing',
  PATROLLING = 'patrolling'
}



export interface ItemRequirement {
  level?: number
  attack?: number
  strength?: number
  defense?: number
  ranged?: number
  skill?: string
}

// ============== SYSTEM-SPECIFIC INTERFACES ==============

// Persistence System types
export interface IPlayerSystemForPersistence {
  saveAllPlayers(): Promise<number>;
  getPlayerCount(): number;
  getOnlinePlayerIds(): string[];
}

// Pathfinding System types
export interface RaycastHit {
  point: THREE.Vector3;
  face?: {
    a: number;
    b: number;
    c: number;
    normal: THREE.Vector3;
    materialIndex: number;
  } | null;
  distance: number;
}

export interface Waypoint {
  position: THREE.Vector3;
  isCorner?: boolean;
}

export interface PathRequest {
  playerId: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  callback: (path: THREE.Vector3[]) => void;
}

// NPC System types
export interface BankTransaction {
  type: 'bank_deposit' | 'bank_withdraw';
  itemId: string;
  quantity: number;
  playerId: string;
  timestamp: number;
}

export interface StoreTransaction {
  type: 'buy' | 'sell';
  itemId: string;
  quantity: number;
  totalPrice: number;
  playerId: string;
  timestamp: number;
}

export interface PlayerBankStorage {
  playerId: string;
  items: Map<string, number>; // itemId -> quantity
  lastAccessed: number;
}

// Movement System types - using consolidated MovementComponent above

export interface ClickToMoveEvent {
  type: 'click-to-move';
  playerId: string; // Keep as string for external events
  targetPosition: Position3D;
  timestamp: number;
}

export interface PlayerPositionUpdatedEvent {
  type: 'player-position-updated';
  playerId: string;
  position: Position3D;
}

// Mob System types
export interface RPGMobData {
  id: string;
  type: MobType;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  position: Position3D;
  isAlive: boolean;
  isAggressive: boolean;
  aggroRange: number;
  wanderRadius: number;
  respawnTime: number;
  spawnLocation: Position3D;
  
  // Combat stats per GDD
  stats: {
    attack: number;
    strength: number;
    defense: number;
    constitution: number;
    ranged: number;
  };
  
  // Equipment and drops
  equipment: {
    weapon: { id: number; name: string; type: AttackType } | null;
    armor: { id: number; name: string } | null;
  };
  
  // Loot table reference
  lootTable: string;
  
  // AI state
  aiState: 'idle' | 'patrolling' | 'chasing' | 'attacking' | 'returning' | 'dead';
  target: string | null; // Player ID being targeted
  lastAI: number; // Last AI update timestamp
  homePosition: Position3D;
}

export interface MobSpawnConfig {
  type: RPGMobData['type'];
  name: string;
  level: number;
  stats: RPGMobData['stats'];
  equipment: RPGMobData['equipment'];
  lootTable: string;
  isAggressive: boolean;
  aggroRange: number;
  respawnTime: number;
}


export interface RPGHeadstoneApp {
  init(): Promise<void>;
  destroy(): void;
  update(dt: number): void;
  getHeadstoneData(): HeadstoneData;
}

// Entity Manager types  
export interface EntitySpawnRequest {
  type: 'item' | 'mob' | 'npc' | 'resource' | 'static';
  config: unknown; // RPGEntityConfig - will need proper import
}

// Equipment System types - EquipmentSlot now handles all equipment slot functionality

export interface RPGPlayerEquipment {
  playerId: string;
  weapon: EquipmentSlot;
  shield: EquipmentSlot;
  helmet: EquipmentSlot;
  body: EquipmentSlot;
  legs: EquipmentSlot;
  arrows: EquipmentSlot;
  totalStats: {
    attack: number;
    strength: number;
    defense: number;
    ranged: number;
    constitution: number;
  };
}

// Interaction System types
export interface TooltipElement extends HTMLElement {
  _removeListener?: () => void;
}

export interface RPGInteractableEntity {
  id: string;
  object: THREE.Object3D;
  type: 'attack' | 'pickup' | 'talk' | 'gather' | 'use' | 'move' | 'mob' | 'item' | 'resource' | 'npc';
  distance: number;
  description: string;
  name: string;
  level?: number;
  health?: number;
  maxHealth?: number;
  actions: InteractionAction[];
}

export interface InteractionAction {
  id: string;
  label: string;
  icon?: string;
  enabled: boolean;
  distance?: number;
  callback: () => void;
}

export interface InteractionHover {
  entity: RPGInteractableEntity;
  originalMaterial?: THREE.Material | THREE.Material[] | null;
}

export interface RPGInteractionSystemEvents {
  'interaction:attack': { targetId: string; targetType: string }
  'interaction:gather': { targetId: string; resourceType: string; tool?: string }
  'interaction:loot': { targetId: string }
  'interaction:talk': { targetId: string }
  'interaction:pickup': { targetId: string }
  'interaction:use': { targetId: string; itemId: string }
}

// Inventory Interaction System types
export interface DragData {
  sourceType: 'inventory' | 'equipment' | 'ground';
  sourceSlot: number;
  itemId: string;
  itemData: RPGItem;
  dragElement?: HTMLElement;
  originalPosition?: { x: number; y: number };
}

export interface DropTarget {
  type: 'inventory' | 'equipment';
  slot: number | string;
  element: HTMLElement;
  accepts: string[]; // Item types this slot accepts
}

// Loot drop interface
export interface LootDrop {
  itemId: string;
  quantity: number;
  weight?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare';
  rare?: boolean;
}

// Loot entry interface for loot systems
export interface LootEntry {
  itemId: string;
  quantity: number;
  chance: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare';
  weight?: number;
}


export interface PlayerInventoryState {
  playerId: string;
  items: InventoryItem[];
  coins: number;
}

export interface InventoryDataState {
  items: InventoryItem[];
  coins: number;
  maxSlots: number;
}

// Item Action System types
export interface ItemAction {
  id: string;
  label: string;
  callback: (playerId: string, itemId: string, slot: number | null) => void;
  priority: number; // Lower number = higher priority in menu
  condition: ((item: RPGItem, playerId: string) => boolean) | null;
}

export interface ItemContextMenu {
  playerId: string;
  itemId: string;
  slot: number | null;
  actions: ItemAction[];
  position: { x: number; y: number };
  visible: boolean;
}

// Item Pickup System types
export interface GroundItem {
  id: string;
  item: RPGItem;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  droppedBy: string | null;
  droppedAt: number;
  despawnTime: number;
}

// Note: RPGPlayerRow interface is defined in database.ts

// Interaction System interface for proper typing
export interface RPGInteractionSystem extends System {
  registerMob(mesh: THREE.Mesh, data: { id: string; name: string; level: number; health: number; maxHealth: number }): void;
  registerItem(mesh: THREE.Mesh, data: { id: string; name: string; canPickup: boolean }): void;
  registerResource(mesh: THREE.Mesh, data: { id: string; name: string; type: string; requiredTool: string; canGather: boolean }): void;
  registerNPC(mesh: THREE.Mesh, data: { id: string; name: string; canTalk: boolean; isShop: boolean }): void;
}

// ============== END SYSTEM-SPECIFIC INTERFACES ==============

// ============== WORLD STRUCTURE INTERFACES ==============

export interface BiomeData {
  id: string;
  name: string;
  description: string;
  difficultyLevel: 0 | 1 | 2 | 3; // 0 = safe zones, 1-3 = mob levels
  terrain: 'forest' | 'wastes' | 'plains' | 'frozen' | 'corrupted' | 'lake' | 'mountain';
  resources: string[]; // Available resource types
  mobs: string[]; // Mob types that spawn here
  fogIntensity: number; // 0-1 for visual atmosphere
  ambientSound: string;
  colorScheme: {
    primary: string;
    secondary: string;
    fog: string;
  };
  color: number; // Hex color for terrain rendering
  heightRange: [number, number]; // Min and max height multipliers
  terrainMultiplier: number; // Terrain height multiplier
  waterLevel: number; // Water level threshold
  maxSlope: number; // Maximum walkable slope
  mobTypes: string[]; // Mob types that spawn here
  difficulty: number; // Difficulty level (0-3)
  baseHeight: number; // Base terrain height
  heightVariation: number; // Height variation factor
  resourceDensity: number; // Resource spawn density
  resourceTypes: string[]; // Types of resources that can spawn
}

// Type for spawn point data based on spawn type
export interface PlayerSpawnPointData {
  isMainSpawn: boolean;
}

export interface ResourceSpawnPointData {
  type: string; // Can be 'bank', 'general_store', 'tree', 'trees', 'fishing_spot', 'mine', etc.
  name: string;
  resourceId: string;  
  respawnTime: number;
}

export interface MobSpawnPointData {
  type: string; // Can be mob type like 'goblin', 'bandit', etc.
  mobId: string;
  spawnRadius: number;
  maxCount: number;
  respawnTime: number;
}

export type ZoneSpawnPointData = PlayerSpawnPointData | ResourceSpawnPointData | MobSpawnPointData;

export interface ZoneSpawnPoint {
  type: 'player' | 'mob' | 'resource';
  position: Position3D;
  data: PlayerSpawnPointData | ResourceSpawnPointData | MobSpawnPointData;
}

export interface ZoneData {
  id: string;
  name: string;
  biome: string;
  bounds: {
    x: number;
    z: number;
    width: number;
    height: number;
  };
  difficultyLevel: 0 | 1 | 2 | 3;
  isTown: boolean;
  hasBank: boolean;
  hasGeneralStore: boolean;
  spawnPoints: ZoneSpawnPoint[];
}

export interface DeathLocationData {
  playerId: string;
  deathPosition: { x: number; y: number; z: number };
  timestamp: number;
  items: InventoryItem[]; // Items dropped at death location (headstone)
}

// ============== WORLD AREAS INTERFACES ==============

export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

export interface BiomeResource {
  type: 'tree' | 'fishing_spot' | 'mine' | 'herb_patch';
  position: WorldPosition;
  resourceId: string;
  respawnTime: number;
  level: number; // Required level to harvest
}

export interface NPCLocation {
  id: string;
  name: string;
  type: 'bank' | 'general_store' | 'skill_trainer' | 'quest_giver';
  position: WorldPosition;
  services: string[];
  modelPath: string;
  description: string;
}

export interface MobSpawnPoint {
  mobId: string;
  position: WorldPosition;
  spawnRadius: number;
  maxCount: number;
  respawnTime: number;
}

export interface WorldArea {
  id: string;
  name: string;
  description: string;
  difficultyLevel: 0 | 1 | 2 | 3; // 0 = safe zone, 1-3 = combat zones
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  biomeType: string;
  safeZone: boolean;
  npcs: NPCLocation[];
  resources: BiomeResource[];
  mobSpawns: MobSpawnPoint[];
  connections: string[]; // Connected area IDs
  specialFeatures: string[];
}

// ============== BANKING AND STORES INTERFACES ==============

export interface BankData {
  id: string;
  name: string;
  location: {
    zone: string;
    position: { x: number; y: number; z: number };
  };
  isShared: boolean; // Per GDD: Each bank is separate (no shared storage)
  maxSlots: number; // Unlimited per GDD
  description: string;
}

export interface StoreItem {
  itemId: string;
  name: string;
  price: number; // In coins
  stockQuantity: number; // -1 for unlimited
  restockTime: number; // Milliseconds to restock if limited, 0 for no restock
}

export interface StoreData {
  id: string;
  name: string;
  location: {
    zone: string;
    position: { x: number; y: number; z: number };
  };
  items: StoreItem[];
  buyback: boolean; // Whether store buys items from players
  buybackRate: number; // Percentage of item value (0-1) 
  description: string;
}

// ============== MOB INTERFACES ==============

export interface MobStats {
  level: number;
  health: number;
  attack: number;
  strength: number;
  defense: number;
  ranged: number;
  constitution: number;
}

// Mob spawner statistics interface
export interface MobSpawnStats {
  totalMobs: number;
  level1Mobs: number;
  level2Mobs: number;
  level3Mobs: number;
  byType: Record<string, number>;
  spawnedMobs: number;
}

export interface MobDropItem {
  itemId: string;
  quantity: number;
  chance: number; // 0-1 probability
  isGuaranteed: boolean;
}

export interface MobBehavior {
  aggressive: boolean;
  aggroRange: number; // meters
  chaseRange: number; // meters
  returnToSpawn: boolean;
  ignoreLowLevelPlayers: boolean; // Level threshold for aggression
  levelThreshold: number;
}

export interface MobData {
  id: string;
  name: string;
  description: string;
  difficultyLevel: 1 | 2 | 3; // Per GDD: Level 1-3 mobs
  mobType: string; // Optional type identifier for spawning system
  stats: MobStats;
  behavior: MobBehavior;
  drops: MobDropItem[];
  spawnBiomes: string[];
  modelPath: string;
  animationSet: {
    idle: string;
    walk: string;
    attack: string;
    death: string;
  };
  respawnTime: number; // milliseconds
  xpReward: number; // Base XP for killing this mob
}

// ============== STARTING ITEMS INTERFACES ==============

export interface StartingItem {
  id: string;
  name: string;
  quantity: number;
  stackable: boolean;
  equipped: boolean; // Whether to auto-equip on spawn
  slot: EquipmentSlotName | null;
}

// ============== EQUIPMENT REQUIREMENTS INTERFACES ==============

export interface LevelRequirement {
  attack: number;
  strength: number;
  defense: number;
  ranged: number;
  constitution: number;
}

export interface EquipmentDataJSON {
  levelRequirements: {
    weapons: Record<string, LevelRequirement>;
    shields: Record<string, LevelRequirement>;
    armor: {
      helmets: Record<string, LevelRequirement>;
      body: Record<string, LevelRequirement>;
      legs: Record<string, LevelRequirement>;
    };
    ammunition: Record<string, LevelRequirement>;
  };
  equipmentColors: Record<string, string>;
  starterEquipment: Array<{
    itemId: string;
    slot: string;
    autoEquip: boolean;
  }>;
}

export interface StarterEquipmentItem {
  itemId: string;
  slot: string;
  autoEquip: boolean;
}


// Define event data types for the banking system
export interface BankOpenData {
  playerId: string;
  bankId: string;
  playerPosition: Position3D;
}

export interface BankCloseData {
  playerId: string;
  bankId: string;
}

export interface BankDepositData {
  playerId: string;
  itemId: string;
  quantity: number;
  slotIndex: number;
}

export interface BankWithdrawData {
  playerId: string;
  itemId: string;
  quantity: number;
  slotIndex: number;
}

export interface BankDepositAllData {
  playerId: string;
}