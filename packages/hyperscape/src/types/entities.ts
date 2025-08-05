/**
 * Entity-specific type definitions for the system
 * These types are shared across all entity implementations
 */

import type * as THREE from '../extras/three';
import type { EntityData, Position3D } from './base-types';
import type { 
  Item, 
  InventoryItem,
  MovementComponent,
  InventoryComponent,
  StatsComponent,
  NPCComponent,
  PrayerComponent,
  EquipmentComponent
} from './core';

// Enums for better type safety instead of string literals
export enum EntityType {
  PLAYER = 'player',
  MOB = 'mob',
  ITEM = 'item',
  NPC = 'npc',
  RESOURCE = 'resource',
  STATIC = 'static'
}

export enum InteractionType {
  ATTACK = 'attack',
  PICKUP = 'pickup',
  TALK = 'talk',
  GATHER = 'gather',
  USE = 'use',
  LOOT = 'loot',
  BANK = 'bank',
  TRADE = 'trade',
  TRAIN = 'train',
  QUEST = 'quest'
}

export enum PlayerCombatStyle {
  ATTACK = 'attack',
  STRENGTH = 'strength',
  DEFENSE = 'defense',
  RANGED = 'ranged'
}

export enum MobType {
  GOBLIN = 'goblin',
  BANDIT = 'bandit',
  BARBARIAN = 'barbarian',
  HOBGOBLIN = 'hobgoblin',
  GUARD = 'guard',
  DARK_WARRIOR = 'dark_warrior',
  BLACK_KNIGHT = 'black_knight',
  ICE_WARRIOR = 'ice_warrior',
  DARK_RANGER = 'dark_ranger'
}

export enum MobAIState {
  IDLE = 'idle',
  PATROL = 'patrol',
  CHASE = 'chase',
  ATTACK = 'attack',
  FLEE = 'flee',
  DEAD = 'dead'
}

export enum NPCType {
  BANK = 'bank',
  STORE = 'store',
  QUEST_GIVER = 'quest_giver',
  TRAINER = 'trainer'
}

export enum ResourceType {
  TREE = 'tree',
  FISHING_SPOT = 'fishing_spot',
  MINING_ROCK = 'mining_rock'
}

export enum ItemRarity {
  ALWAYS = 'always',
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

// Re-export for convenience
export type { Position3D, Item };

// Base Entity configuration - generic with strongly typed properties
export interface EntityConfig<TProperties = BaseEntityProperties> {
  id: string;
  name: string;
  type: EntityType;
  position: Position3D;
  rotation: Position3D;
  scale: Position3D;
  visible: boolean;
  interactable: boolean;
  interactionType: InteractionType | null;
  interactionDistance: number;
  description: string;
  model: string | null; // GLB/VRM model URL
  properties: TProperties; // Strongly typed entity-specific data
}

// Entity interaction data interface
export interface EntityInteractionData {
  playerId: string;
  entityId: string;
  interactionType: string;
  position: Position3D;
  playerPosition: Position3D;
}

// Base entity data interfaces
export interface BaseEntityData extends EntityData {
  id: string;
  type: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  position: [number, number, number];
  quaternion: [number, number, number, number];
}

// Player entity data
export interface PlayerEntityData extends BaseEntityData {
  playerId: string;
  playerName: string;
  level: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  combatStyle: PlayerCombatStyle;
  equipment: Record<string, Item | null>;
  inventory: Item[];
  skills: Record<string, { level: number; xp: number }>;
}

// Bank entity data  
export interface BankEntityData extends BaseEntityData {
  bankId: string;
  townId: string;
  capacity: number;
  interactionDistance: number;
}

// Item entity config
export interface ItemEntityConfig extends EntityConfig<ItemEntityProperties> {
  type: EntityType.ITEM;
  itemType: string;
  itemId: string;
  quantity: number;
  stackable: boolean;
  value: number;
  weight: number;
  rarity: ItemRarity;
  stats: Record<string, number>;
  requirements: Record<string, number>;
  effects: Array<{ type: string; value: number; duration: number }>;
  armorSlot: string | null;
  // Additional properties needed for Item compatibility  
  examine?: string;
  modelPath?: string;
  iconPath?: string;
  healAmount?: number;
}

// Mob entity config
export interface MobEntityConfig extends EntityConfig<MobEntityProperties> {
  type: EntityType.MOB;
  mobType: MobType;
  level: number;
  maxHealth: number;
  currentHealth: number;
  attackPower: number;
  defense: number;
  attackSpeed: number;
  moveSpeed: number;
  aggroRange: number;
  combatRange: number;
  respawnTime: number;
  xpReward: number;
  lootTable: Array<{ itemId: string; chance: number; minQuantity: number; maxQuantity: number }>;
  spawnPoint: Position3D;
  aiState: MobAIState;
  targetPlayerId: string | null;
  lastAttackTime: number;
  deathTime: number | null;
}

// NPC entity config
export interface NPCEntityConfig extends EntityConfig<NPCEntityProperties> {
  npcType: NPCType;
  npcId: string;
  dialogueLines: string[];
  services: string[];
  inventory: Array<{
    itemId: string;
    quantity: number;
    price: number;
  }>;
  skillsOffered: string[];
  questsAvailable: string[];
}

// Resource entity config
export interface ResourceEntityConfig extends EntityConfig<ResourceEntityProperties> {
  resourceType: ResourceType;
  resourceId: string;
  harvestSkill: string;
  requiredLevel: number;
  harvestTime: number;
  respawnTime: number;
  harvestYield: Array<{
    itemId: string;
    quantity: number;
    chance: number;
  }>;
  depleted: boolean;
  lastHarvestTime: number;
}

// Component interfaces
export interface HealthComponent {
  current: number;
  max: number;
  regenerationRate: number;
  isDead: boolean;
}

export interface VisualComponent {
  mesh: THREE.Mesh | null;
  nameSprite: THREE.Sprite | null;
  healthSprite: THREE.Sprite | null;
  isVisible: boolean;
  currentAnimation: string | null;
  animationTime: number;
}

// Entity combat component
export interface EntityCombatComponent {
  level: number;
  health: number;
  maxHealth: number;
  attackLevel: number;
  strengthLevel: number;
  defenseLevel: number;
  rangedLevel: number;
  inCombat: boolean;
  combatTarget: string | null;
  lastAttackTime: number;
  combatStyle: PlayerCombatStyle;
}

// Strongly typed properties for different entity types
export interface BaseEntityProperties {
  movementComponent: MovementComponent | null;
  combatComponent: EntityCombatComponent | null;
  healthComponent: HealthComponent | null;
  visualComponent: VisualComponent | null;
  // Basic entity data that all entities have
  health: number;
  maxHealth: number;
  level: number;
}

// Player-specific properties
export interface PlayerEntityProperties extends BaseEntityProperties {
  statsComponent: StatsComponent;
  inventoryComponent: InventoryComponent;
  equipmentComponent: EquipmentComponent;
  prayerComponent: PrayerComponent | null;
  // Player specific data
  health: number;
  maxHealth: number;
  level: number;
  playerId: string;
  playerName: string;
  stamina: number;
  maxStamina: number;
  combatStyle: PlayerCombatStyle;
}

// NPC-specific properties
export interface NPCEntityProperties extends BaseEntityProperties {
  npcComponent: NPCComponent;
  dialogue: string[];
  shopInventory: Array<{ itemId: string; price: number; quantity: number }>;
  questGiver: boolean;
}

// Mob-specific properties
export interface MobEntityProperties extends BaseEntityProperties {
  // Mobs use combat and movement components from base
}

// Item-specific properties
export interface ItemEntityProperties extends BaseEntityProperties {
  itemId: string;
  harvestable: boolean;
  dialogue: string[];
  quantity: number;
  stackable: boolean;
  value: number;
  weight: number;
  rarity: ItemRarity;
}

// Resource-specific properties
export interface ResourceEntityProperties extends BaseEntityProperties {
  // Resources can have health and visual components
  resourceType: ResourceType;
  harvestable: boolean;
  respawnTime: number;
  toolRequired: string;
  skillRequired: string;
  xpReward: number;
}

// Bank-specific properties
export interface BankEntityProperties extends BaseEntityProperties {
  bankId: string;
  townId: string;
}

// Bank storage item
export interface BankStorageItem extends Item {
  storedAt: number;
  bankId: string;
}

// Headstone data for death locations
export interface HeadstoneData {
  playerId: string;
  playerName: string;
  deathTime: number;
  deathMessage: string;
  position: Position3D;
  items: InventoryItem[];
  itemCount: number;
  despawnTime: number;
}

export interface LocalHeadstoneData extends Omit<HeadstoneData, 'deathTime'> {
  id: string;
  createdAt: number;
}

// Headstone entity config
export interface HeadstoneEntityConfig extends EntityConfig<BaseEntityProperties> {
  headstoneData: HeadstoneData;
}

// Spawn data interfaces for entity creation
export interface ItemSpawnData {
  id: string;
  customId: string;
  name: string;
  position: Position3D;
  model: string | null;
  quantity: number;
  stackable: boolean;
  value: number;
}

export interface MobSpawnData {
  mobType: string;
  position: Position3D;
  level: number;
  customId: string;
  name: string;
}

export interface ResourceSpawnData {
  customId: string;
  name: string;
  position: Position3D;
  model: string | null;
  resourceType: ResourceType;
  respawnTime: number;
  toolRequired: string;
  skillRequired: string;
  xpReward: number;
}

export interface NPCSpawnData {
  customId: string;
  name: string;
  position: Position3D;
  model: string | null;
  npcType: NPCType;
  dialogues: Array<{
    text: string;
    options: Array<{
      text: string;
      action: string | null;
      nextDialogue: number | null;
    }>;
  }>;
  questGiver: boolean;
  shopkeeper: boolean;
  bankTeller: boolean;
}

// Component interface for ECS system
export interface Component<T = Record<string, string | number | boolean>> {
  name: string;
  data: T;
  update(deltaTime: number): void;
  destroy(): void;
}