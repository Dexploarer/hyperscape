/**
 * Data Manager - Centralized Content Database
 * 
 * Provides a single point of access to all externalized data including:
 * - Items and equipment
 * - Mobs and creatures
 * - World areas and spawn points
 * - Treasure locations
 * - Banks and stores
 * - Starting items and equipment requirements
 * 
 * This system validates data on load and provides type-safe access methods.
 */

import { BANKS, GENERAL_STORES } from './banks-stores';
import { equipmentRequirements } from './EquipmentRequirements';
import { ITEMS } from './items';
import { ALL_MOBS, getMobById, getMobsByDifficulty } from './mobs';
import { STARTING_ITEMS } from './starting-items';
import { TREASURE_LOCATIONS, getAllTreasureLocations, getTreasureLocationsByDifficulty } from './treasure-locations';
import { ALL_WORLD_AREAS, STARTER_TOWNS, getMobSpawnsInArea, getNPCsInArea } from './world-areas';

import type { Item, MobData, TreasureLocation } from '../types/core';
import type { DataValidationResult } from '../types/validation-types'
import type { MobSpawnPoint, NPCLocation, WorldArea } from './world-areas';

/**
 * Data validation results
 */
// DataValidationResult moved to shared types

/**
 * Centralized Data Manager
 */
export class DataManager {
  private static instance: DataManager;
  private isInitialized = false;
  private validationResult: DataValidationResult | null = null;
  private worldAssetsDir: string | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * Load external assets written by 3D Asset Forge (manifests under world/assets)
   */
  private async loadExternalAssetsFromWorld(): Promise<void> {
    // Determine world assets dir: try server's world/assets path
    // Server sets worldDir in src/server/index.ts and serves assets at /world-assets/
    // Here, read relative to the server package root
    try {
      // Resolve from process.cwd() (packages/hyperscape during dev-final)
      const baseDir = process.cwd()
      const assetsDir = require('path').join(baseDir, 'world', 'assets')
      const fs = require('fs')
      if (!fs.existsSync(assetsDir)) return
      this.worldAssetsDir = assetsDir
      const manifestsDir = require('path').join(assetsDir, 'manifests')
      if (!fs.existsSync(manifestsDir)) return

      // Load items
      const itemsPath = require('path').join(manifestsDir, 'items.json')
      if (fs.existsSync(itemsPath)) {
        const raw = fs.readFileSync(itemsPath, 'utf-8') as string
        const list = JSON.parse(raw) as Array<import('../types/core').Item>
        for (const it of list) {
          if (!it || !it.id) continue
          // Ensure required defaults
          const normalized = this.normalizeItem(it)
          ;(ITEMS as Map<string, import('../types/core').Item>).set(normalized.id, normalized)
        }
        console.log(`[DataManager] Loaded ${list.length} external items from manifests`)
      }

      // Load mobs
      const mobsPath = require('path').join(manifestsDir, 'mobs.json')
      if (fs.existsSync(mobsPath)) {
        const raw = fs.readFileSync(mobsPath, 'utf-8') as string
        const list = JSON.parse(raw) as Array<import('../types/core').MobData>
        for (const mob of list) {
          if (!mob || !mob.id) continue
          ;(ALL_MOBS as Record<string, import('../types/core').MobData>)[mob.id] = mob
        }
        console.log(`[DataManager] Loaded ${list.length} external mobs from manifests`)
      }

      // Load NPCs
      const npcsPath = require('path').join(manifestsDir, 'npcs.json')
      if (fs.existsSync(npcsPath)) {
        const raw = fs.readFileSync(npcsPath, 'utf-8') as string
        const list = JSON.parse(raw) as Array<{
          id: string;
          name: string;
          description: string;
          type: string;
          modelPath: string;
          animations?: { idle?: string; talk?: string };
          services: string[];
        }>
        
        // NPCs can be added to world areas dynamically
        // For now, just log that they're available
        console.log(`[DataManager] Loaded ${list.length} external NPCs from manifests`)
        
        // Store NPCs for later use by NPC spawning systems
        this.worldAssetsDir
        for (const npc of list) {
          if (!npc || !npc.id) continue
          // Store in a global NPCs map for systems to access
          if (!(globalThis as { EXTERNAL_NPCS?: Map<string, unknown> }).EXTERNAL_NPCS) {
            (globalThis as { EXTERNAL_NPCS?: Map<string, unknown> }).EXTERNAL_NPCS = new Map()
          }
          (globalThis as unknown as { EXTERNAL_NPCS: Map<string, unknown> }).EXTERNAL_NPCS.set(npc.id, npc)
        }
      }

      // Load resources
      const resourcesPath = require('path').join(manifestsDir, 'resources.json')
      if (fs.existsSync(resourcesPath)) {
        const raw = fs.readFileSync(resourcesPath, 'utf-8') as string
        const list = JSON.parse(raw) as Array<{
          id: string;
          name: string;
          type: string;
          modelPath: string;
          iconPath?: string;
          harvestSkill: string;
          requiredLevel: number;
          harvestTime: number;
          respawnTime: number;
          yields: Array<{ itemId: string; quantity: number; chance: number }>;
        }>
        
        console.log(`[DataManager] Loaded ${list.length} external resources from manifests`)
        
        // Store resources for terrain system and resource system to access
        if (!(globalThis as { EXTERNAL_RESOURCES?: Map<string, unknown> }).EXTERNAL_RESOURCES) {
          (globalThis as { EXTERNAL_RESOURCES?: Map<string, unknown> }).EXTERNAL_RESOURCES = new Map()
        }
        for (const resource of list) {
          if (!resource || !resource.id) continue
          (globalThis as unknown as { EXTERNAL_RESOURCES: Map<string, unknown> }).EXTERNAL_RESOURCES.set(resource.id, resource)
        }
      }

      // Load buildings
      const buildingsPath = require('path').join(manifestsDir, 'buildings.json')
      if (fs.existsSync(buildingsPath)) {
        const raw = fs.readFileSync(buildingsPath, 'utf-8') as string
        const list = JSON.parse(raw) as Array<{
          id: string;
          name: string;
          type: string;
          modelPath: string;
          iconPath?: string;
          description: string;
        }>
        
        console.log(`[DataManager] Loaded ${list.length} external buildings from manifests`)
        
        // Store buildings for world building systems
        if (!(globalThis as { EXTERNAL_BUILDINGS?: Map<string, unknown> }).EXTERNAL_BUILDINGS) {
          (globalThis as { EXTERNAL_BUILDINGS?: Map<string, unknown> }).EXTERNAL_BUILDINGS = new Map()
        }
        for (const building of list) {
          if (!building || !building.id) continue
          (globalThis as unknown as { EXTERNAL_BUILDINGS: Map<string, unknown> }).EXTERNAL_BUILDINGS.set(building.id, building)
        }
      }

      // Load avatars
      const avatarsPath = require('path').join(manifestsDir, 'avatars.json')
      if (fs.existsSync(avatarsPath)) {
        const raw = fs.readFileSync(avatarsPath, 'utf-8') as string
        const list = JSON.parse(raw) as Array<{
          id: string;
          name: string;
          description: string;
          type: string;
          isRigged: boolean;
          characterHeight: number;
          modelPath: string;
          animations?: { idle?: string; walk?: string; run?: string };
        }>
        
        console.log(`[DataManager] Loaded ${list.length} external avatars from manifests`)
        
        // Store avatars for player system
        if (!(globalThis as { EXTERNAL_AVATARS?: Map<string, unknown> }).EXTERNAL_AVATARS) {
          (globalThis as { EXTERNAL_AVATARS?: Map<string, unknown> }).EXTERNAL_AVATARS = new Map()
        }
        for (const avatar of list) {
          if (!avatar || !avatar.id) continue
          (globalThis as unknown as { EXTERNAL_AVATARS: Map<string, unknown> }).EXTERNAL_AVATARS.set(avatar.id, avatar)
        }
      }
    } catch (e) {
      // Non-fatal
      console.warn('[DataManager] Failed to load external manifests:', (e as Error).message)
    }
  }

  private normalizeItem(item: import('../types/core').Item): import('../types/core').Item {
    // Ensure required fields have sane defaults and enums
    const { ItemType, WeaponType, EquipmentSlotName, AttackType } = require('../types/core')
    const safeWeaponType = item.weaponType ?? WeaponType.NONE
    const equipSlot = item.equipSlot ?? null
    const attackType = item.attackType ?? null
    const defaults = {
      quantity: 1,
      stackable: false,
      maxStackSize: 1,
      value: 0,
      weight: 0.1,
      equipable: !!equipSlot,
      description: item.description || item.name || 'Item',
      examine: item.examine || item.description || item.name || 'Item',
      healAmount: item.healAmount ?? 0,
      stats: item.stats || { attack: 0, defense: 0, strength: 0 },
      bonuses: item.bonuses || { attack: 0, defense: 0, strength: 0, ranged: 0 },
      requirements: item.requirements || { level: 1, skills: {} },
    }
    return {
      ...item,
      type: item.type,
      weaponType: safeWeaponType,
      equipSlot: equipSlot as import('../types/core').EquipmentSlotName | null,
      attackType: attackType as import('../types/core').AttackType | null,
      ...defaults,
    }
  }

  /**
   * Initialize the data manager and validate all data
   */
  public async initialize(): Promise<DataValidationResult> {
    if (this.isInitialized) {
      return this.validationResult!;
    }

    // Attempt to load externally generated assets (Forge) before validation
    try {
      await this.loadExternalAssetsFromWorld();
    } catch (e) {
      console.warn('[DataManager] External asset load skipped:', (e as Error).message)
    }

    this.validationResult = await this.validateAllData();
    this.isInitialized = true;

    if (this.validationResult.isValid) {
            console.log(`[DataManager] 📊 Data Summary: ${this.validationResult.itemCount} items, ${this.validationResult.mobCount} mobs, ${this.validationResult.areaCount} areas, ${this.validationResult.treasureCount} treasure locations`);
    } else {
      console.error('[DataManager] ❌ Data validation failed:', this.validationResult.errors);
    }

    return this.validationResult;
  }

  /**
   * Validate all externalized data
   */
  private async validateAllData(): Promise<DataValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate items
    const itemCount = ITEMS.size;
    if (itemCount === 0) {
      errors.push('No items found in ITEMS');
    }

    // Validate mobs
    const mobCount = Object.keys(ALL_MOBS).length;
    if (mobCount === 0) {
      errors.push('No mobs found in ALL_MOBS');
    }

    // Validate world areas
    const areaCount = Object.keys(ALL_WORLD_AREAS).length;
    if (areaCount === 0) {
      errors.push('No world areas found in ALL_WORLD_AREAS');
    }

    // Validate treasure locations
    const treasureCount = Object.keys(TREASURE_LOCATIONS).length;
    if (treasureCount === 0) {
      warnings.push('No treasure locations found in TREASURE_LOCATIONS');
    }

    // Validate cross-references
    this.validateCrossReferences(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      itemCount,
      mobCount,
      areaCount,
      treasureCount
    };
  }

  /**
   * Validate cross-references between data sets
   */
  private validateCrossReferences(errors: string[], _warnings: string[]): void {
    // Check that mob spawn points reference valid mobs
    for (const [areaId, area] of Object.entries(ALL_WORLD_AREAS)) {
      if (area.mobSpawns) {
        for (const mobSpawn of area.mobSpawns) {
          if (!ALL_MOBS[mobSpawn.mobId]) {
            errors.push(`Area ${areaId} references unknown mob: ${mobSpawn.mobId}`);
          }
        }
      }
    }

    // Check that starter items reference valid items
    for (const startingItem of STARTING_ITEMS) {
      if (!ITEMS.has(startingItem.id)) {
        errors.push(`Starting item references unknown item: ${startingItem.id}`);
      }
    }
  }

  /**
   * Get validation result
   */
  public getValidationResult(): DataValidationResult | null {
    return this.validationResult;
  }

  // =============================================================================
  // ITEM DATA ACCESS METHODS
  // =============================================================================

  /**
   * Get all items
   */
  public getAllItems(): Map<string, Item> {
    return ITEMS;
  }

  /**
   * Get item by ID
   */
  public getItem(itemId: string): Item | null {
    return ITEMS.get(itemId) || null;
  }

  /**
   * Get items by type
   */
  public getItemsByType(itemType: string): Item[] {
    return Array.from(ITEMS.values()).filter(item => item.type === itemType);
  }

  // =============================================================================
  // MOB DATA ACCESS METHODS
  // =============================================================================

  /**
   * Get all mobs
   */
  public getAllMobs(): Record<string, MobData> {
    return ALL_MOBS;
  }

  /**
   * Get mob by ID
   */
  public getMob(mobId: string): MobData | null {
    return getMobById(mobId);
  }

  /**
   * Get mobs by difficulty level
   */
  public getMobsByDifficulty(difficulty: 1 | 2 | 3): MobData[] {
    return getMobsByDifficulty(difficulty);
  }

  // =============================================================================
  // WORLD AREA DATA ACCESS METHODS
  // =============================================================================

  /**
   * Get all world areas
   */
  public getAllWorldAreas(): Record<string, WorldArea> {
    return ALL_WORLD_AREAS;
  }

  /**
   * Get starter towns
   */
  public getStarterTowns(): Record<string, WorldArea> {
    return STARTER_TOWNS;
  }

  /**
   * Get world area by ID
   */
  public getWorldArea(areaId: string): WorldArea | null {
    return ALL_WORLD_AREAS[areaId] || null;
  }

  /**
   * Get mob spawns in area
   */
  public getMobSpawnsInArea(areaId: string): MobSpawnPoint[] {
    return getMobSpawnsInArea(areaId);
  }

  /**
   * Get NPCs in area
   */
  public getNPCsInArea(areaId: string): NPCLocation[] {
    return getNPCsInArea(areaId);
  }

  // =============================================================================
  // TREASURE DATA ACCESS METHODS
  // =============================================================================

  /**
   * Get all treasure locations
   */
  public getAllTreasureLocations(): TreasureLocation[] {
    return getAllTreasureLocations();
  }

  /**
   * Get treasure locations by difficulty
   */
  public getTreasureLocationsByDifficulty(difficulty: 1 | 2 | 3): TreasureLocation[] {
    return getTreasureLocationsByDifficulty(difficulty);
  }

  /**
   * Get treasure location by ID
   */
  public getTreasureLocation(locationId: string): TreasureLocation | null {
    return TREASURE_LOCATIONS[locationId] || null;
  }

  // =============================================================================
  // STORE AND BANK DATA ACCESS METHODS
  // =============================================================================

  /**
   * Get all general stores
   */
  public getGeneralStores() {
    return GENERAL_STORES;
  }

  /**
   * Get all banks
   */
  public getBanks() {
    return BANKS;
  }

  // =============================================================================
  // EQUIPMENT AND STARTING DATA ACCESS METHODS
  // =============================================================================

  /**
   * Get equipment requirements
   */
  public getEquipmentRequirements() {
    return equipmentRequirements;
  }

  /**
   * Get starting items
   */
  public getStartingItems() {
    return STARTING_ITEMS;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if data manager is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get data summary for debugging
   */
  public getDataSummary() {
    if (!this.isInitialized) {
      return 'DataManager not initialized';
    }

    return {
      items: ITEMS.size,
      mobs: Object.keys(ALL_MOBS).length,
      worldAreas: Object.keys(ALL_WORLD_AREAS).length,
      treasureLocations: Object.keys(TREASURE_LOCATIONS).length,
      stores: Object.keys(GENERAL_STORES).length,
      banks: Object.keys(BANKS).length,
      startingItems: STARTING_ITEMS.length,
      isValid: this.validationResult?.isValid || false
    };
  }
}

// Export singleton instance
export const dataManager = DataManager.getInstance();