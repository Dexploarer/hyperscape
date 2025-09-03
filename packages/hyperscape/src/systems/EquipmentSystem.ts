
/**
 * Equipment System
 * Handles equipment management, stat bonuses, level requirements, and visual attachment per GDD specifications
 * - Equipment slots (weapon, shield, helmet, body, legs, arrows)
 * - Level requirements for equipment tiers
 * - Stat bonuses from equipped items
 * - Right-click equip/unequip functionality
 * - Visual equipment attachment to player avatars
 * - Colored cube representations for equipment
 */

import THREE from '../extras/three';
import { EventType } from '../types/events';
import { dataManager } from '../data/DataManager';
import { equipmentRequirements } from '../data/EquipmentRequirements';
import { SystemBase } from './SystemBase';
import { Logger } from '../utils/Logger';

import { World } from '../World';
import {
  AttackType,
  ItemBonuses,
  ItemType,
  LevelRequirement,
  EquipmentSlot,
  EquipmentSlotName,
  PlayerEquipment as PlayerEquipment,
  Item,
  WeaponType
} from '../types/core';
import { ItemRarity } from '../types/entities';
import type { PlayerWithEquipmentSupport } from '../types/ui-types';

// Re-export for backward compatibility
export type { EquipmentSlot, PlayerEquipment };

/**
 * Equipment System - GDD Compliant
 * Manages player equipment per GDD specifications:
 * - 6 equipment slots as defined in GDD
 * - Level requirements (bronze=1, steel=10, mithril=20)
 * - Automatic stat calculation from equipped items
 * - Arrow consumption integration with combat
 * - Equipment persistence via inventory system
 */
export class EquipmentSystem extends SystemBase {
  private playerEquipment = new Map<string, PlayerEquipment>();
  private equipmentColors = new Map<string, number>();
  private playerSkills = new Map<string, Record<string, { level: number; xp: number }>>();
  
  // GDD-compliant level requirements
  // Level requirements are now stored in item data directly

  constructor(world: World) {
    super(world, {
      name: 'rpg-equipment',
      dependencies: {
        required: ['rpg-inventory'], // Equipment needs inventory for item management
        optional: ['rpg-player', 'rpg-ui'] // Better with player system and UI for notifications
      },
      autoCleanup: true
    });
    this.initializeEquipmentColors();
  }

  private initializeEquipmentColors(): void {
    // Equipment colors are now loaded from EquipmentRequirements
  }

  async init(): Promise<void> {
    
    // Set up type-safe event subscriptions
    this.subscribe(EventType.PLAYER_REGISTERED, (data) => {
      this.initializePlayerEquipment({ id: data.playerId });
    });
    this.subscribe(EventType.PLAYER_UNREGISTERED, (data) => {
      this.cleanupPlayerEquipment(data.playerId);
    });

    // Listen to skills updates for reactive patterns
    this.subscribe(EventType.SKILLS_UPDATED, (data) => {
      this.playerSkills.set(data.playerId, data.skills);
    });
    this.subscribe(EventType.EQUIPMENT_EQUIP, (data) => {
      this.equipItem({
        playerId: data.playerId,
        itemId: data.itemId,
        slot: data.slot,
        inventorySlot: undefined
      });
    });
    this.subscribe(EventType.EQUIPMENT_UNEQUIP, (data) => {
      this.unequipItem({
        playerId: data.playerId,
        slot: data.slot
      });
    });
    this.subscribe(EventType.EQUIPMENT_TRY_EQUIP, (data) => {
      this.tryEquipItem({
        playerId: data.playerId,
        itemId: data.itemId,
        inventorySlot: undefined
      });
    });
    this.subscribe(EventType.EQUIPMENT_FORCE_EQUIP, (data) => {
      this.handleForceEquip({
        playerId: data.playerId,
        item: this.getItemData(data.itemId)!,
        slot: data.slot
      });
    });
    this.subscribe(EventType.INVENTORY_ITEM_RIGHT_CLICK, (data) => {
      this.handleItemRightClick({
        playerId: data.playerId,
        itemId: parseInt(data.itemId, 10),
        slot: data.slot
      });
    });
    this.subscribe(EventType.EQUIPMENT_CONSUME_ARROW, (data) => {
      this.consumeArrow(data.playerId);
    });
    
  }

  start(): void {
  }

  private initializePlayerEquipment(playerData: { id: string }): void {
    const equipment: PlayerEquipment = {
      playerId: playerData.id,
      weapon: { id: `${playerData.id}_weapon`, name: 'Weapon Slot', slot: EquipmentSlotName.WEAPON, itemId: null, item: null },
      shield: { id: `${playerData.id}_shield`, name: 'Shield Slot', slot: EquipmentSlotName.SHIELD, itemId: null, item: null },
      helmet: { id: `${playerData.id}_helmet`, name: 'Helmet Slot', slot: EquipmentSlotName.HELMET, itemId: null, item: null },
      body: { id: `${playerData.id}_body`, name: 'Body Slot', slot: EquipmentSlotName.BODY, itemId: null, item: null },
      legs: { id: `${playerData.id}_legs`, name: 'Legs Slot', slot: EquipmentSlotName.LEGS, itemId: null, item: null },
      arrows: { id: `${playerData.id}_arrows`, name: 'Arrow Slot', slot: EquipmentSlotName.ARROWS, itemId: null, item: null },
      totalStats: {
        attack: 0,
        strength: 0,
        defense: 0,
        ranged: 0,
        constitution: 0
      }
    };
    
    this.playerEquipment.set(playerData.id, equipment);
    
    // Equip starting equipment per GDD (bronze sword)
    this.equipStartingItems(playerData.id);
    
  }

  private equipStartingItems(playerId: string): void {
    // Per GDD, players start with bronze sword equipped
    const bronzeSword = this.getItemData('bronze_sword');
    if (bronzeSword) {
      this.forceEquipItem(playerId, bronzeSword, 'weapon');
    }
  }

  private cleanupPlayerEquipment(playerId: string): void {
    this.playerEquipment.delete(playerId);
  }

  private handleItemRightClick(data: { playerId: string; itemId: number; slot: number }): void {
    
    const itemData = this.getItemData(data.itemId);
    if (!itemData) {
      Logger.system('EquipmentSystem', ` Unknown item: ${data.itemId}`);
      return;
    }
    
    // Determine if this is equippable
    const equipSlot = this.getEquipmentSlot(itemData);
    if (equipSlot) {
      this.tryEquipItem({
        playerId: data.playerId,
        itemId: data.itemId,
        inventorySlot: data.slot
      });
    } else {
      // Not equippable - maybe it's consumable?
      if (itemData.type === 'food') {
        this.emitTypedEvent(EventType.INVENTORY_CONSUME_ITEM, {
          playerId: data.playerId,
          itemId: data.itemId,
          slot: data.slot
        });
      }
    }
  }

  private tryEquipItem(data: { playerId: string; itemId: string | number; inventorySlot?: number }): void {
    const player = this.world.getPlayer(data.playerId);
    const equipment = this.playerEquipment.get(data.playerId);
    
    if (!player || !equipment) {
      Logger.system('EquipmentSystem', ` Player or equipment not found: ${data.playerId}`);
      return;
    }
    
    const itemData = this.getItemData(data.itemId);
    if (!itemData) {
      Logger.system('EquipmentSystem', ` Item not found: ${data.itemId}`);
      return;
    }
    
    const equipSlot = this.getEquipmentSlot(itemData);
    if (!equipSlot) {
      Logger.system('EquipmentSystem', ` Item not equippable: ${itemData.name}`);
      this.sendMessage(data.playerId, `${itemData.name} cannot be equipped.`, 'warning');
      return;
    }
    
    // Check level requirements
    if (!this.meetsLevelRequirements(data.playerId, itemData)) {
      const requirements = equipmentRequirements.getLevelRequirements(itemData.id as string) || {};
      const reqText = Object.entries(requirements as Record<string, number>).map(([skill, level]) => 
        `${skill} ${level}`
      ).join(', ');
      
      this.sendMessage(data.playerId, `You need ${reqText} to equip ${itemData.name}.`, 'warning');
      return;
    }
    
    // Check if item is in inventory
    if (!this.playerHasItem(data.playerId, data.itemId)) {
      Logger.system('EquipmentSystem', ` Player ${data.playerId} doesn't have item ${data.itemId}`);
      return;
    }
    
    // Perform the equipment
    this.equipItem({
      playerId: data.playerId,
      itemId: data.itemId,
      slot: equipSlot,
      inventorySlot: data.inventorySlot
    });
  }

  private equipItem(data: { playerId: string; itemId: string | number; slot: string; inventorySlot?: number }): void {
    const equipment = this.playerEquipment.get(data.playerId);
    if (!equipment) return;
    
    // Check for valid itemId before calling getItemData
    if (data.itemId === null || data.itemId === undefined) {
      Logger.system('EquipmentSystem', ` equipItem called with invalid itemId for player ${data.playerId}`);
      return;
    }
    
    const itemData = this.getItemData(data.itemId);
    if (!itemData) return;
    
    const slot = data.slot;
    if (!this.isValidEquipmentSlot(slot)) return;
    
    const equipmentSlot = equipment[slot];
    if (!equipmentSlot) {
      Logger.systemError('EquipmentSystem', `Equipment slot ${slot} is null for player ${data.playerId}`);
      return;
    }
    
    // Unequip current item in slot if any
    if (equipmentSlot.itemId) {
      this.unequipItem({
        playerId: data.playerId,
        slot: data.slot
      });
    }
    
    // Equip new item
    equipmentSlot.itemId = typeof data.itemId === "string" ? parseInt(data.itemId, 10) : data.itemId;
    equipmentSlot.item = itemData;
    
    // Create visual representation
    this.createEquipmentVisual(data.playerId, equipmentSlot);
    
    // Remove from inventory
    this.emitTypedEvent(EventType.INVENTORY_ITEM_REMOVED, {
      playerId: data.playerId,
      itemId: data.itemId,
      quantity: 1,
      slot: data.inventorySlot
    });
    
    // Update stats
    this.recalculateStats(data.playerId);
    
    // Update combat system with new equipment
    this.emitTypedEvent(EventType.PLAYER_EQUIPMENT_CHANGED, {
      playerId: data.playerId,
      equipment: this.getEquipmentData(data.playerId)
    });
    
    this.sendMessage(data.playerId, `Equipped ${itemData.name}.`, 'info');
  }

  private unequipItem(data: { playerId: string; slot: string }): void {
    const equipment = this.playerEquipment.get(data.playerId);
    if (!equipment) return;
    
    const slot = data.slot;
    if (!this.isValidEquipmentSlot(slot)) return;
    
    const equipmentSlot = equipment[slot];
    if (!equipmentSlot || !equipmentSlot.itemId) return;
    
    // Additional check for item data
    if (!equipmentSlot.item) {
      Logger.systemError('EquipmentSystem', `Cannot unequip item: item data is null for slot ${slot} on player ${data.playerId}`);
      return;
    }
    
    // Store item name before clearing the slot
    const itemName = equipmentSlot.item.name;
    
    // Add back to inventory - use correct event format for InventoryItemAddedPayload
    this.emitTypedEvent(EventType.INVENTORY_ITEM_ADDED, {
      playerId: data.playerId,
      item: {
        id: `inv_${data.playerId}_${Date.now()}`,
        itemId: equipmentSlot.itemId?.toString() || '',
        quantity: 1,
        slot: -1, // Let system find empty slot
        metadata: null
      }
    });
    
    // Always proceed with unequipping (assume inventory has space)
    // Remove visual representation
    this.removeEquipmentVisual(equipmentSlot);
    
    // Clear equipment slot
    equipmentSlot.itemId = null;
    equipmentSlot.item = null;
    
    // Update stats
    this.recalculateStats(data.playerId);
    
    // Update combat system
    this.emitTypedEvent(EventType.PLAYER_EQUIPMENT_CHANGED, {
      playerId: data.playerId,
      equipment: this.getEquipmentData(data.playerId)
    });
    
    this.sendMessage(data.playerId, `Unequipped ${itemName}.`, 'info');
  }

  private handleForceEquip(data: { playerId: string; item: Item; slot: string }): void {
    this.forceEquipItem(data.playerId, data.item, data.slot);
  }

  private forceEquipItem(playerId: string, itemData: Item, slot: string): void {
    const equipment = this.playerEquipment.get(playerId);
    if (!equipment) {
      Logger.system('EquipmentSystem', ` No equipment data for player ${playerId}, initializing...`);
      this.initializePlayerEquipment({ id: playerId });
      return;
    }
    
    const equipSlot = slot as keyof PlayerEquipment;
    if (equipSlot === 'playerId' || equipSlot === 'totalStats') return;
    
    const equipmentSlot = equipment[equipSlot] as EquipmentSlot;
    if (!equipmentSlot) {
      Logger.systemError('EquipmentSystem', `Equipment slot ${equipSlot} is null for player ${playerId}`);
      return;
    }
    
    equipmentSlot.itemId = parseInt(itemData.id, 10) || 0;
    equipmentSlot.item = itemData;
    
    // Create visual representation
    this.createEquipmentVisual(playerId, equipmentSlot);
    
    this.recalculateStats(playerId);
    
    // Update combat system
    this.emitTypedEvent(EventType.PLAYER_EQUIPMENT_CHANGED, {
      playerId: playerId,
      equipment: this.getEquipmentData(playerId)
    });

  }

  private recalculateStats(playerId: string): void {
    const equipment = this.playerEquipment.get(playerId);
    if (!equipment) return;
    
    // Reset stats
    equipment.totalStats = {
      attack: 0,
      strength: 0,
      defense: 0,
      ranged: 0,
      constitution: 0
    };
    
    // Add bonuses from each equipped item
    const slots = [
      equipment.weapon,
      equipment.shield, 
      equipment.helmet,
      equipment.body,
      equipment.legs,
      equipment.arrows
    ].filter((slot): slot is EquipmentSlot => slot !== null);
    
    slots.forEach(slot => {
      if (slot.item) {
        const bonuses = slot.item.bonuses || {};
        
        Object.keys(equipment.totalStats).forEach(stat => {
          if (bonuses[stat]) {
            equipment.totalStats[stat as keyof typeof equipment.totalStats] += bonuses[stat];
          }
        });
      }
    });
    
    // Emit stats update
    this.emitTypedEvent(EventType.PLAYER_STATS_EQUIPMENT_UPDATED, {
      playerId: playerId,
      equipmentStats: equipment.totalStats
    });
    
  }

  private getEquipmentSlot(itemData: Item): string | null {
    switch (itemData.type) {
      case ItemType.WEAPON:
        return itemData.weaponType === WeaponType.BOW || itemData.weaponType === WeaponType.CROSSBOW ? 'weapon' : 'weapon';
      case ItemType.ARMOR:
        return itemData.equipSlot || null;
      case ItemType.AMMUNITION:
        return 'arrows';
      default:
        return null;
    }
  }

  private meetsLevelRequirements(playerId: string, itemData: Item): boolean {
    const requirements = equipmentRequirements.getLevelRequirements(itemData.id as string);
    if (!requirements) return true; // No requirements
    
    // Get player skills (simplified for MVP)
    const playerSkills = this.getPlayerSkills(playerId);
    
    // Check each specific skill requirement
    const skillChecks = [
      { skill: 'attack' as const, required: requirements.attack },
      { skill: 'strength' as const, required: requirements.strength },
      { skill: 'defense' as const, required: requirements.defense },
      { skill: 'ranged' as const, required: requirements.ranged },
      { skill: 'constitution' as const, required: requirements.constitution }
    ];
    
    for (const { skill, required } of skillChecks) {
      const playerLevel = playerSkills[skill] || 1;
      if (playerLevel < required) {
        return false;
      }
    }
    
    return true;
  }

  private getPlayerSkills(playerId: string): Record<string, number> {
    // Use cached skills data (reactive pattern)
    const cachedSkills = this.playerSkills.get(playerId);
    
    if (cachedSkills) {
      return {
        attack: cachedSkills.attack?.level || 1,
        strength: cachedSkills.strength?.level || 1,
        defense: cachedSkills.defense?.level || 1,
        ranged: cachedSkills.ranged?.level || 1,
        constitution: cachedSkills.constitution?.level || 10,
        woodcutting: cachedSkills.woodcutting?.level || 1,
        fishing: cachedSkills.fishing?.level || 1,
        firemaking: cachedSkills.firemaking?.level || 1,
        cooking: cachedSkills.cooking?.level || 1
      };
    }
    
    // Fallback defaults (will be updated when SKILLS_UPDATED event is received)
    return {
      attack: 1,
      strength: 1,
      defense: 1,
      ranged: 1,
      constitution: 10,
      woodcutting: 1,
      fishing: 1,
      firemaking: 1,
      cooking: 1
    };
  }

  private playerHasItem(playerId: string, itemId: number | string): boolean {
    // Check with inventory system via events
    const itemIdStr = itemId.toString();
    
    // Request item check from inventory system
    let hasItemResult = false;
    this.emitTypedEvent(EventType.INVENTORY_HAS_ITEM, {
      playerId: playerId,
      itemId: itemIdStr,
      callback: ((hasItem: boolean) => {
        hasItemResult = hasItem;
      }) as unknown
    });
    
    if (hasItemResult) {
      return true;
    }
    
    // Also check if item is already equipped
    const equipment = this.playerEquipment.get(playerId);
    if (equipment) {
      const slots = [
        equipment.weapon,
        equipment.shield, 
        equipment.helmet,
        equipment.body,
        equipment.legs,
        equipment.arrows
      ].filter((slot): slot is EquipmentSlot => slot !== null);
      
      const isEquipped = slots.some(slot => 
        slot.itemId === parseInt(itemIdStr, 10) || slot.itemId === itemId
      );
      if (isEquipped) {
        return true;
      }
    }
    
    Logger.system('EquipmentSystem', ` Player ${playerId} does not have item ${itemId}`);
    return false;
  }

  private getItemData(itemId: string | number): Item | null {
    // Check for null/undefined itemId first
    if (itemId === null || itemId === undefined) {
      Logger.system('EquipmentSystem', 'getItemData called with null/undefined itemId');
      return null;
    }
    
    // Get item data through centralized DataManager
    const itemIdStr = itemId.toString();
    const itemData = dataManager.getItem(itemIdStr);
    
    if (itemData) {
      return itemData;
    }
    
    // Final fallback: check if it's a known item from the level requirements
    const requirements = equipmentRequirements.getLevelRequirements(itemIdStr);
    if (requirements) {
      // Create basic item data for known equipment
      const itemType = this.inferItemTypeFromId(itemIdStr);
      const inferredBonuses = this.inferBonusesFromLevelRequirement(requirements);
      
      return {
        id: itemIdStr,
        name: this.formatItemName(itemIdStr),
        type: itemType.type as ItemType,
        quantity: 1,
        stackable: itemType.type === 'ammunition',
        maxStackSize: itemType.type === 'ammunition' ? 1000 : 1,
        value: 0,
        weight: 1,
        equipSlot: itemType.armorSlot ? itemType.armorSlot as EquipmentSlotName : null,
        weaponType: itemType.weaponType ? itemType.weaponType as WeaponType : WeaponType.NONE,
        equipable: true,
        attackType: itemType.type === ItemType.WEAPON ? AttackType.MELEE : null,
        description: `Equipment with requirements: ${equipmentRequirements.getRequirementText(itemIdStr)}`,
        examine: `Level requirements: ${equipmentRequirements.getRequirementText(itemIdStr)}`,
        tradeable: true,
        rarity: ItemRarity.COMMON,
        modelPath: '',
        iconPath: '',
        healAmount: 0,
        stats: {
          attack: inferredBonuses.attack || 0,
          defense: inferredBonuses.defense || 0,
          strength: inferredBonuses.strength || 0
        },
        bonuses: {
          attack: inferredBonuses.attack,
          defense: inferredBonuses.defense,
          ranged: inferredBonuses.ranged,
          strength: inferredBonuses.strength
        },
        requirements: {
          level: Math.max(requirements.attack, requirements.strength, requirements.defense, requirements.ranged, requirements.constitution),
          skills: {
            attack: requirements.attack,
            strength: requirements.strength,
            defense: requirements.defense,
            ranged: requirements.ranged,
            constitution: requirements.constitution
          }
        }
      };
    }
    
    Logger.system('EquipmentSystem', ` Item not found: ${itemId}`);
    return null;
  }

  private inferItemTypeFromId(itemId: string): { type: string; weaponType?: string; armorSlot?: string } {
    const id = itemId.toLowerCase();
    
    if (id.includes('sword') || id.includes('bow')) {
      return {
        type: 'weapon',
        weaponType: id.includes('bow') ? AttackType.RANGED : AttackType.MELEE
      };
    }
    
    if (id.includes('shield')) {
      return {
        type: 'armor',
        armorSlot: 'shield'
      };
    }
    
    if (id.includes('helmet')) {
      return {
        type: 'armor',
        armorSlot: 'helmet'
      };
    }
    
    if (id.includes('body')) {
      return {
        type: 'armor',
        armorSlot: 'body'
      };
    }
    
    if (id.includes('legs')) {
      return {
        type: 'armor',
        armorSlot: 'legs'
      };
    }
    
    if (id.includes('arrow')) {
      return {
        type: 'arrow'
      };
    }
    
    return { type: 'unknown' };
  }

  private formatItemName(itemId: string): string {
    return itemId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private inferBonusesFromLevelRequirement(requirements: LevelRequirement): ItemBonuses {
    // Infer combat bonuses from level requirements
    // Higher requirements typically mean better stats
    return {
      attack: Math.floor(requirements.attack * 0.8),
      defense: Math.floor(requirements.defense * 0.8),
      ranged: Math.floor(requirements.ranged * 0.8),
      strength: Math.floor(requirements.strength * 0.6)
    };
  }

  private sendMessage(playerId: string, message: string, type: 'info' | 'warning' | 'error'): void {
    this.emitTypedEvent(EventType.UI_MESSAGE, {
      playerId: playerId,
      message: message,
      type: type
    });
  }

  // Public API
  getPlayerEquipment(playerId: string): PlayerEquipment | undefined {
    return this.playerEquipment.get(playerId);
  }

  getEquipmentData(playerId: string): Record<string, unknown> {
    const equipment = this.playerEquipment.get(playerId);
    if (!equipment) return {};
    
    return {
      weapon: equipment.weapon?.item || null,
      shield: equipment.shield?.item || null,
      helmet: equipment.helmet?.item || null,
      body: equipment.body?.item || null,
      legs: equipment.legs?.item || null,
      arrows: equipment.arrows?.item || null
    };
  }

  getEquipmentStats(playerId: string): Record<string, number> {
    const equipment = this.playerEquipment.get(playerId);
    return equipment?.totalStats || {
      attack: 0,
      strength: 0,
      defense: 0,
      ranged: 0,
      constitution: 0
    };
  }

  isItemEquipped(playerId: string, itemId: number): boolean {
    const equipment = this.playerEquipment.get(playerId);
    if (!equipment) return false;
    
    const slots = [
      equipment.weapon,
      equipment.shield, 
      equipment.helmet,
      equipment.body,
      equipment.legs,
      equipment.arrows
    ].filter((slot): slot is EquipmentSlot => slot !== null);
    
    return slots.some(slot => slot.itemId === itemId);
  }

  canEquipItem(playerId: string, itemId: number): boolean {
    const itemData = this.getItemData(itemId);
    if (!itemData) return false;
    
    const equipSlot = this.getEquipmentSlot(itemData);
    if (!equipSlot) return false;
    
    return this.meetsLevelRequirements(playerId, itemData);
  }

  getArrowCount(playerId: string): number {
    const equipment = this.playerEquipment.get(playerId);
    if (!equipment || !equipment.arrows?.item) return 0;
    
    // Get arrow quantity from inventory system
    const inventorySystem = this.world.getSystem('rpg-inventory') as import('./InventorySystem').InventorySystem | undefined;
    if (inventorySystem && equipment.arrows.itemId) {
      const arrowCount = inventorySystem.getItemQuantity(playerId, equipment.arrows.itemId?.toString() || '');
      return Math.max(0, arrowCount);
    }
    
    // Fallback to equipment quantity if available (assume it has quantity)
    return (equipment.arrows as { quantity?: number }).quantity || 0;
  }

  public consumeArrow(playerId: string): boolean {
    const equipment = this.playerEquipment.get(playerId);
    if (!equipment || !equipment.arrows?.item) {
      return false;
    }
    
    // Request inventory to remove arrow via typed event API
    if (equipment.arrows.itemId) {
      this.emitTypedEvent(EventType.INVENTORY_REMOVE_ITEM, {
        playerId,
        itemId: equipment.arrows.itemId?.toString() || '',
        quantity: 1,
      });

      {
        // Update equipment quantity
        const arrowsWithQuantity = equipment.arrows as { quantity?: number };
        if (arrowsWithQuantity.quantity) {
          arrowsWithQuantity.quantity = Math.max(0, arrowsWithQuantity.quantity - 1);
        }
        
        // If no arrows left, unequip the arrow slot
        if (this.getArrowCount(playerId) === 0) {
          this.unequipItem({ playerId, slot: 'arrows' });
        }
        
        return true;
      }
    }
    
    return false;
  }



  /**
   * Create visual representation of equipped item
   */
  private createEquipmentVisual(playerId: string, slot: EquipmentSlot): void {
    if (!THREE || !slot.item) return;

    const { item } = slot;
    let geometry: THREE.BufferGeometry;

    // Create geometry based on equipment slot
    switch (slot.slot) {
      case 'helmet':
        geometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
        break;
      case 'body':
        geometry = new THREE.BoxGeometry(0.5, 0.6, 0.3);
        break;
      case 'legs':
        geometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
        break;
      case 'weapon':
        geometry = new THREE.BoxGeometry(0.1, 1.2, 0.1);
        break;
      case 'shield':
        geometry = new THREE.BoxGeometry(0.05, 0.8, 0.5);
        break;
      case 'arrows':
        geometry = new THREE.BoxGeometry(0.05, 0.6, 0.05);
        break;
      default:
        geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    }

    const color = equipmentRequirements.getEquipmentColor(item.name as string) ?? equipmentRequirements.getDefaultColorByType(item.type as string);
    const material = new THREE.MeshLambertMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.9
    });

    const visual = new THREE.Mesh(geometry, material);
    visual.name = `equipment_${slot.slot}_${playerId}`;
    visual.userData = {
      type: 'equipment_visual',
      playerId: playerId,
      slot: slot.slot,
      itemId: item.id
    };

    slot.visualMesh = visual;
    
    // Add to world scene
    if (this.world.stage.scene) {
      this.world.stage.scene.add(visual);
    }

  }

  /**
   * Remove visual representation of equipment
   */
  private removeEquipmentVisual(slot: EquipmentSlot): void {
    if (slot.visualMesh) {
      // Remove from scene
      if (slot.visualMesh.parent) {
        slot.visualMesh.parent.remove(slot.visualMesh);
      }
      slot.visualMesh = undefined;
    }
  }

  /**
   * Get equipment color based on material
   */
  private getEquipmentColor(item: Item): number {
    const nameLower = (item.name as string)?.toLowerCase() || '';
    
    return equipmentRequirements.getEquipmentColor(nameLower) ?? equipmentRequirements.getDefaultColorByType(item.type as string);
  }

  /**
   * Type guard to check if player supports equipment attachment
   */
  private hasEquipmentSupport(player: unknown): player is PlayerWithEquipmentSupport {
    return (
      typeof player === 'object' &&
      player !== null &&
      'position' in player &&
      typeof (player as PlayerWithEquipmentSupport).getBoneTransform === 'function'
    );
  }

  /**
   * Update equipment positions to follow player avatars
   */
  private updateEquipmentPositions(): void {
    for (const [playerId, equipment] of this.playerEquipment) {
      // Check if player still exists (may have disconnected)
      const player = this.world.getPlayer ? 
        this.world.getPlayer(playerId) : 
        this.world.entities?.get(playerId);
      
      // Skip if player not found or doesn't have equipment support
      if (!player || !this.hasEquipmentSupport(player)) {
        // Clean up equipment for disconnected players
        if (!player) {
          this.playerEquipment.delete(playerId);
        }
        continue;
      }

      this.updatePlayerEquipmentVisuals(player, equipment);
    }
  }

  /**
   * Update equipment visuals for a specific player
   */
  private updatePlayerEquipmentVisuals(player: PlayerWithEquipmentSupport, equipment: PlayerEquipment): void {
    const attachmentPoints = {
      helmet: { bone: 'head', offset: new THREE.Vector3(0, 0.1, 0) },
      body: { bone: 'spine', offset: new THREE.Vector3(0, 0, 0) },
      legs: { bone: 'hips', offset: new THREE.Vector3(0, -0.2, 0) },
      weapon: { bone: 'rightHand', offset: new THREE.Vector3(0.1, 0, 0) },
      shield: { bone: 'leftHand', offset: new THREE.Vector3(-0.1, 0, 0) },
      arrows: { bone: 'spine', offset: new THREE.Vector3(0, 0, -0.2) }
    };

    // Process each equipment slot
    Object.entries(attachmentPoints).forEach(([slotName, attachment]) => {
      const slot = equipment[slotName as keyof PlayerEquipment] as EquipmentSlot;
      if (slot?.visualMesh) {
        this.attachEquipmentToPlayer(player, slot.visualMesh as THREE.Object3D, attachment.bone, attachment.offset);
      }
    });
  }

  /**
   * Attach equipment visual to player avatar bone
   */
  private attachEquipmentToPlayer(player: PlayerWithEquipmentSupport, equipmentMesh: THREE.Object3D, boneName: string, offset: THREE.Vector3): void {
    try {
      // Try to get bone transform from player avatar
      if (player.getBoneTransform) {
        const boneMatrix = player.getBoneTransform(boneName);
        if (boneMatrix) {
          equipmentMesh.position.setFromMatrixPosition(boneMatrix);
          equipmentMesh.quaternion.setFromRotationMatrix(boneMatrix);
          equipmentMesh.position.add(offset);
          return;
        }
      }
      
      // Fallback: attach to player position with offset
      if (player.position) {
        equipmentMesh.position.copy(player.position);
        equipmentMesh.position.add(offset);
        equipmentMesh.position.y += 1.8; // Approximate head height
      } else {
        // Ultimate fallback: use zero position
        equipmentMesh.position.set(0, 1.8, 0);
        equipmentMesh.position.add(offset);
      }
    } catch (_error) {
      // Silent fallback to player position or zero
      if (player.position) {
        equipmentMesh.position.copy(player.position);
        equipmentMesh.position.add(offset);
        equipmentMesh.position.y += 1.8;
      } else {
        equipmentMesh.position.set(0, 1.8, 0);
        equipmentMesh.position.add(offset);
      }
    }
  }


  /**
   * Main update loop - preserve equipment visual updates
   */
  update(_dt: number): void {
    // Update equipment visuals every frame
    this.updateEquipmentPositions();
  }

  private isValidEquipmentSlot(slot: string): slot is keyof Omit<PlayerEquipment, 'playerId' | 'totalStats'> {
    return Object.values(EquipmentSlotName).includes(slot as EquipmentSlotName);
  }

  /**
   * Cleanup when system is destroyed
   */
  destroy(): void {
    // Clear all player equipment data
    this.playerEquipment.clear();
    
    
    Logger.system('EquipmentSystem', 'Equipment system destroyed and cleaned up');
    
    // Call parent cleanup
    super.destroy();
  }
}