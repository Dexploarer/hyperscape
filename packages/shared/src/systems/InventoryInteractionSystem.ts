
/**
 * Inventory Interaction System
 * 
 * Handles both:
 * - Drag-and-drop for inventory/equipment management
 * - Item right-click context menus (Wear, Drop, Eat, Use, etc.)
 * Provides complete RuneScape-style inventory interactions.
 */


import { DragData, DropTarget, ItemType, Item, EquipmentSlotName, ItemAction, ItemContextMenu } from '../types/core';
import { ItemRarity } from '../types/entities';
import { dataManager } from '../data/DataManager';

// Re-export for backward compatibility
export type { DragData, DropTarget };

  import { EventType } from '../types/events';
  import type { World } from '../types/index';
  import { SystemBase } from './SystemBase';
  import { Logger } from '../utils/Logger';

/**
 * Create a minimal Item with all required properties
 */
function createMinimalItem(id: string, name: string, type: ItemType = ItemType.MISC): Item {
  return {
    id,
    name,
    type,
    quantity: 1,
    stackable: false,
    maxStackSize: 1,
    value: 0,
    weight: 1,
    equipSlot: null,
    weaponType: null,
    equipable: false,
    attackType: null,
    description: `A ${name}`,
    examine: `It's a ${name}.`,
    tradeable: true,
    rarity: ItemRarity.COMMON,
    modelPath: '',
    iconPath: '',
    healAmount: 0,
    stats: {
      attack: 0,
      defense: 0,
      strength: 0
    },
    bonuses: {},
    requirements: {
      level: 1,
      skills: {}
    }
  };
}

export class InventoryInteractionSystem extends SystemBase {
  // Drag-and-drop state
  private currentDrag?: DragData;
  private dropTargets: Map<string, DropTarget> = new Map();
  private dragPreview?: HTMLElement;
  private isDragging: boolean = false;
  private playerEquipment = new Map<string, Record<string, Item>>();
  
  // Context menu state (merged from ItemActionSystem)
  private contextMenus: Map<string, ItemContextMenu> = new Map();
  private itemActions: Map<string, ItemAction[]> = new Map();

  constructor(world: World) {
    super(world, { 
      name: 'inventory-interaction',
      dependencies: {
        required: [],
        optional: ['inventory', 'equipment', 'ui']
      },
      autoCleanup: true
    });
    this.registerDefaultActions();
  }

  async init(): Promise<void> {
    // Listen for UI events via event bus
    this.subscribe(EventType.UI_OPEN_MENU, (data: { playerId: string; inventoryElement: HTMLElement; equipmentElement?: HTMLElement }) =>
      this.setupInventoryInteractions(data)
    );
    this.subscribe(EventType.UI_CLOSE_MENU, () => this.cleanupInteractions());

    // Listen to equipment changes for reactive patterns
    this.subscribe<{ playerId: string; slot: EquipmentSlotName; itemId: string | null }>(
      EventType.PLAYER_EQUIPMENT_CHANGED,
      (data) => {
        if (!this.playerEquipment.has(data.playerId)) {
          this.playerEquipment.set(data.playerId, {});
        }
        const equipment = this.playerEquipment.get(data.playerId)!;
        if (data.itemId) {
          equipment[data.slot] = createMinimalItem(data.itemId, data.itemId, ItemType.MISC);
        } else {
          delete equipment[data.slot];
        }
      }
    );

    // Listen for drag/drop events
    this.subscribe(EventType.UI_DRAG_DROP, (data: unknown) => this.handleDragStart(data));
    this.subscribe(EventType.UI_DRAG_DROP, (data: unknown) => this.handleDragEnd(data));
    this.subscribe(EventType.UI_DRAG_DROP, (data: unknown) => this.handleDrop(data));

    // Listen for player events
    this.subscribe(EventType.PLAYER_JOINED, (data: { playerId: string }) => this.handlePlayerJoin(data));
    this.subscribe(EventType.PLAYER_LEFT, (data: { playerId: string }) => this.handlePlayerLeave(data));
    this.subscribe(EventType.PLAYER_UNREGISTERED, (data: { id: string }) => {
      this.playerEquipment.delete(data.id);
    });
    
    // Item action system events (merged from ItemActionSystem)
    this.subscribe<{ playerId: string; itemId: string; slot: number; position: { x: number; y: number } }>(
      EventType.ITEM_RIGHT_CLICK, 
      (data) => this.handleItemRightClick(data)
    );
    this.subscribe<{ playerId: string; actionId: string; itemId: string; slot: number }>(
      EventType.ITEM_ACTION_SELECTED,
      (data) => this.handleActionSelected(data)
    );
    this.subscribe<{ playerId: string; itemId: string; position: { x: number; y: number; z: number } }>(
      EventType.CORPSE_CLICK,
      (data) => this.handleGroundItemClick(data)
    );
  }

  start(): void {
  }

  /**
   * Create a complete Item from partial data
   */
  private createCompleteItem(item: Partial<Item>): Item {
    return {
      id: item.id || '',
      name: item.name || item.id || '',
      type: item.type || ItemType.MISC,
      quantity: item.quantity || 1,
      stackable: item.stackable || false,
      value: item.value || 0,
      maxStackSize: item.maxStackSize || 1,
      weight: item.weight || 1,
      equipSlot: item.equipSlot || null,
      weaponType: item.weaponType || null,
      equipable: item.equipable || false,
      attackType: item.attackType || null,
      description: item.description || 'Item',
      examine: item.examine || '',
      tradeable: item.tradeable !== false,
      rarity: item.rarity || ItemRarity.COMMON,
      modelPath: item.modelPath || '',
      iconPath: item.iconPath || '',
      healAmount: item.healAmount || 0,
      stats: item.stats || { attack: 0, defense: 0, strength: 0 },
      bonuses: item.bonuses || { attack: 0, defense: 0, ranged: 0, strength: 0 },
      requirements: item.requirements || { level: 1, skills: {} }
    };
  }

  /**
   * Setup drag and drop interactions for inventory UI
   */
  private setupInventoryInteractions(event: { playerId: string; inventoryElement: HTMLElement; equipmentElement?: HTMLElement }): void {
    
    if (event.inventoryElement) {
      this.setupInventorySlots(event.playerId, event.inventoryElement);
    }
    
    if (event.equipmentElement) {
      this.setupEquipmentSlots(event.playerId, event.equipmentElement);
    }
  }

  /**
   * Setup drag interactions for inventory slots
   */
  private setupInventorySlots(playerId: string, inventoryElement: HTMLElement): void {
    const inventorySlots = inventoryElement.querySelectorAll('[data-inventory-slot]');
    
    inventorySlots.forEach((slot, index) => {
      const slotElement = slot as HTMLElement;
      const slotIndex = parseInt(slotElement.dataset.inventorySlot || index.toString());
      
      // Make slots draggable
      this.makeSlotDraggable(playerId, slotElement, 'inventory', slotIndex);
      
      // Register as drop target
      this.registerDropTarget(`inventory_${playerId}_${slotIndex}`, {
        type: 'inventory',
        slot: slotIndex,
        element: slotElement,
        accepts: ['weapon', 'armor', 'food', 'tool', 'resource', 'ammunition']
      });
    });
    
  }

  /**
   * Setup drag interactions for equipment slots
   */
  private setupEquipmentSlots(playerId: string, equipmentElement: HTMLElement): void {
    const equipmentSlots = equipmentElement.querySelectorAll('[data-equipment-slot]');
    
    equipmentSlots.forEach(slot => {
      const slotElement = slot as HTMLElement;
      const slotType = slotElement.dataset.equipmentSlot || '';
      
      // Make equipment slots draggable (for unequipping)
      this.makeSlotDraggable(playerId, slotElement, 'equipment', slotType);
      
      // Register as drop target with type restrictions
      const acceptedTypes = this.getAcceptedTypesForEquipmentSlot(slotType);
      this.registerDropTarget(`equipment_${playerId}_${slotType}`, {
        type: 'equipment',
        slot: slotType,
        element: slotElement,
        accepts: acceptedTypes
      });
    });
    
  }

  /**
   * Make a slot draggable
   */
  private makeSlotDraggable(playerId: string, element: HTMLElement, sourceType: 'inventory', slot: number): void;
  private makeSlotDraggable(playerId: string, element: HTMLElement, sourceType: 'equipment', slot: string): void;
  private makeSlotDraggable(playerId: string, element: HTMLElement, sourceType: 'inventory' | 'equipment', slot: number | string): void {
    element.draggable = true;
    
    element.addEventListener('dragstart', (_event) => {
      this.handleDragStartEvent(_event as DragEvent, playerId, sourceType, slot);
    });
    
    element.addEventListener('dragend', (_event) => {
      this.handleDragEndEvent(_event);
    });
    
    // Also support touch interactions for mobile
    let touchStart: { x: number; y: number } | null = null;
    
    element.addEventListener('touchstart', (event) => {
      const touch = (event as TouchEvent).touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
      
      // Prevent scrolling during drag
      event.preventDefault();
    });
    
    element.addEventListener('touchmove', (event) => {
      if (!touchStart) return;
      
      const touch = (event as TouchEvent).touches[0];
      const deltaX = Math.abs(touch.clientX - touchStart.x);
      const deltaY = Math.abs(touch.clientY - touchStart.y);
      
      // If moved enough, start drag
      if (deltaX > 10 || deltaY > 10) {
        this.handleTouchDragStart(event as TouchEvent, playerId, sourceType, slot);
        touchStart = null;
      }
      
      event.preventDefault();
    });
    
    element.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.handleTouchDragEnd();
      }
      touchStart = null;
    });
  }

  /**
   * Register a drop target
   */
  private registerDropTarget(id: string, target: DropTarget): void {
    this.dropTargets.set(id, target);
    
    target.element.addEventListener('dragover', (event) => {
      this.handleDragOver(event as DragEvent, target);
    });
    
    target.element.addEventListener('drop', (event) => {
      this.handleDropEvent(event as DragEvent, target);
    });
    
    // Add visual feedback classes
    target.element.classList.add('drop-target');
  }

  /**
   * Handle drag start from HTML5 drag API
   */
  private handleDragStartEvent(event: DragEvent, playerId: string, sourceType: 'inventory' | 'equipment', slot: number | string): void {
    const itemData = this.getItemInSlot(playerId, sourceType, slot);
    if (!itemData) {
      event.preventDefault();
      return;
    }

    // Strong type assumption - sourceType determines slot type
    // inventory = number, equipment = string
    const slotNumber = sourceType === 'inventory' ? slot as number : parseInt(slot as string, 10) || 0;
    
    const dragData: DragData = {
      sourceType: sourceType,
      sourceSlot: slotNumber,
      itemId: itemData.id,
      itemData: itemData,
      dragElement: event.target as HTMLElement,
      originalPosition: { x: event.clientX, y: event.clientY }
    };

    this.startDrag(dragData);
    
    // Set drag data for HTML5 API
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({
        sourceType: sourceType,
        sourceSlot: slot,
        itemId: itemData.id
      }));
      event.dataTransfer.effectAllowed = 'move';
    }

    // Create drag preview
    this.createDragPreview(itemData, event.clientX, event.clientY);
    
  }

  /**
   * Handle touch-based drag start
   */
  private handleTouchDragStart(event: TouchEvent, playerId: string, sourceType: 'inventory' | 'equipment', slot: number | string): void {
    const itemData = this.getItemInSlot(playerId, sourceType, slot);
    if (!itemData) return;

    const touch = event.touches[0];
    // Strong type assumption - sourceType determines slot type
    const slotNumber = sourceType === 'inventory' ? slot as number : parseInt(slot as string, 10) || 0;
    
    const dragData: DragData = {
      sourceType: sourceType,
      sourceSlot: slotNumber,
      itemId: itemData.id,
      itemData: itemData,
      dragElement: event.target as HTMLElement,
      originalPosition: { x: touch.clientX, y: touch.clientY }
    };

    this.startDrag(dragData);
    this.createDragPreview(itemData, touch.clientX, touch.clientY);
    
    // Setup touch move handler for preview
    const touchMoveHandler = (moveEvent: TouchEvent) => {
      if (this.dragPreview) {
        const touch = moveEvent.touches[0];
        this.updateDragPreview(touch.clientX, touch.clientY);
      }
    };
    
    document.addEventListener('touchmove', touchMoveHandler);
    
    // Store handler for cleanup
    // Store touch handler reference for cleanup
    (this as { touchMoveHandler?: (e: TouchEvent) => void }).touchMoveHandler = touchMoveHandler;
  }

  /**
   * Start drag operation
   */
  private startDrag(dragData: DragData): void {
    this.currentDrag = dragData;
    this.isDragging = true;
    
    // Add visual feedback
    if (dragData.dragElement) {
      dragData.dragElement.classList.add('dragging');
    }
    
    // Highlight valid drop targets
    this.highlightValidDropTargets(dragData.itemData);
    
    // Log drag start for debugging
    Logger.system('InventoryInteractionSystem', 'Drag started', {
      sourceType: dragData.sourceType,
      sourceSlot: dragData.sourceSlot,
      itemId: dragData.itemId
    });
  }

  /**
   * Handle drag over event
   */
  private handleDragOver(event: DragEvent, target: DropTarget): void {
    if (!this.currentDrag) return;
    
    // Check if this target accepts the current item
    if (this.canDropOnTarget(this.currentDrag.itemData, target)) {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'move';
      
      // Add hover effect
      target.element.classList.add('drop-hover');
    }
  }

  /**
   * Handle drop event
   */
  private handleDropEvent(event: DragEvent, target: DropTarget): void {
    event.preventDefault();
    
    if (!this.currentDrag) return;
    
    // Remove hover effect
    target.element.classList.remove('drop-hover');
    
    // Check if drop is valid
    if (!this.canDropOnTarget(this.currentDrag.itemData, target)) {
      this.logger.warn(`Invalid drop: ${this.currentDrag.itemData.name} cannot be dropped on ${target.type} slot ${String(target.slot)}`);
      this.cancelDrag();
      return;
    }
    
    // Perform the drop
    this.performDrop(this.currentDrag, target);
  }

  /**
   * Handle touch drag end
   */
  private handleTouchDragEnd(): void {
    if (!this.currentDrag) return;
    
    // Find drop target under the current position
    if (this.dragPreview) {
      const rect = this.dragPreview.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Find element under the drag preview
      this.dragPreview.style.display = 'none';
      const elementUnder = document.elementFromPoint(centerX, centerY);
      this.dragPreview.style.display = 'block';
      
      if (elementUnder) {
        const target = this.findDropTargetForElement(elementUnder);
        if (target && this.canDropOnTarget(this.currentDrag.itemData, target)) {
          this.performDrop(this.currentDrag, target);
          return;
        }
      }
    }
    
    // No valid drop target found
    this.cancelDrag();
  }

  /**
   * Handle HTML5 drag end
   */
  private handleDragEndEvent(_event: DragEvent): void {
    this.endDrag();
  }

  /**
   * Perform the actual drop operation
   */
  private performDrop(dragData: DragData, target: DropTarget): void {
    
    // Handle different drop scenarios
    if (dragData.sourceType === 'inventory' && target.type === 'equipment') {
      // Equip item - use TRY_EQUIP to auto-detect slot
      this.emitTypedEvent(EventType.EQUIPMENT_TRY_EQUIP, {
        playerId: this.getCurrentPlayerId(),
        itemId: dragData.itemId
      });
    } else if (dragData.sourceType === 'equipment' && target.type === 'inventory') {
      // Unequip item
      this.emitTypedEvent(EventType.EQUIPMENT_UNEQUIP, {
        playerId: this.getCurrentPlayerId(),
        slot: dragData.sourceSlot
      });
    } else if (dragData.sourceType === 'inventory' && target.type === 'inventory') {
      // Move item within inventory
      this.emitTypedEvent(EventType.INVENTORY_MOVE, {
        playerId: this.getCurrentPlayerId(),
        fromSlot: dragData.sourceSlot,
        toSlot: target.slot
      });
    } else if (dragData.sourceType === 'equipment' && target.type === 'equipment') {
      // Swap equipment (if compatible)
      this.logger.info('Equipment swap', {
        playerId: this.getCurrentPlayerId(),
        fromSlot: dragData.sourceSlot,
        toSlot: target.slot
      });
    }
    
    this.endDrag();
  }

  /**
   * Cancel drag operation
   */
  private cancelDrag(): void {
    this.endDrag();
  }

  /**
   * End drag operation and cleanup
   */
  private endDrag(): void {
    if (this.currentDrag) {
      // Remove visual feedback
      if (this.currentDrag.dragElement) {
        this.currentDrag.dragElement.classList.remove('dragging');
      }
      
      // Log drag end for debugging
      this.logger.info('Drag ended', { sourceType: this.currentDrag.sourceType, sourceSlot: this.currentDrag.sourceSlot, itemId: this.currentDrag.itemId });
    }
    
    // Clear drag state
    this.currentDrag = undefined;
    this.isDragging = false;
    
    // Remove drag preview
    this.removeDragPreview();
    
    // Remove highlight from drop targets
    this.clearDropTargetHighlights();
    
    // Cleanup touch handler
    // Clean up touch handler
    const self = this as { touchMoveHandler?: (e: TouchEvent) => void };
    if (self.touchMoveHandler) {
      document.removeEventListener('touchmove', self.touchMoveHandler);
      self.touchMoveHandler = undefined;
    }
  }

  /**
   * Create visual drag preview
   */
  private createDragPreview(
     
    itemData: Item, 
    x: number, 
    y: number
  ): void {
    this.dragPreview = document.createElement('div');
    this.dragPreview.className = 'drag-preview';
    this.dragPreview.style.cssText = `
      position: fixed;
      top: ${y - 20}px;
      left: ${x - 20}px;
      width: 40px;
      height: 40px;
      background: ${this.getItemColor(itemData)};
      border: 2px solid #fff;
      border-radius: 4px;
      pointer-events: none;
      z-index: 10000;
      opacity: 0.8;
      transform: rotate(5deg);
    `;
    
    // Add item name
    const label = document.createElement('div');
    label.textContent = itemData.name;
    label.style.cssText = `
      position: absolute;
      top: 45px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      white-space: nowrap;
    `;
    this.dragPreview.appendChild(label);
    
    document.body.appendChild(this.dragPreview);
    
    // Update position on mouse move
    const mouseMoveHandler = (event: MouseEvent) => {
      if (this.dragPreview) {
        this.updateDragPreview(event.clientX, event.clientY);
      }
    };
    
    document.addEventListener('mousemove', mouseMoveHandler);
    // Store mouse handler reference for cleanup
    (this as { mouseMoveHandler?: (e: MouseEvent) => void }).mouseMoveHandler = mouseMoveHandler;
  }

  /**
   * Update drag preview position
   */
  private updateDragPreview(x: number, y: number): void {
    if (this.dragPreview) {
      this.dragPreview.style.left = `${x - 20}px`;
      this.dragPreview.style.top = `${y - 20}px`;
    }
  }

  /**
   * Remove drag preview
   */
  private removeDragPreview(): void {
    if (this.dragPreview) {
      document.body.removeChild(this.dragPreview);
      this.dragPreview = undefined;
    }
    
    // Remove mouse move handler
    // Clean up mouse handler
    const self = this as { mouseMoveHandler?: (e: MouseEvent) => void };
    if (self.mouseMoveHandler) {
      document.removeEventListener('mousemove', self.mouseMoveHandler);
      self.mouseMoveHandler = undefined;
    }
  }

  /**
   * Highlight valid drop targets
   */
  private highlightValidDropTargets(
     
    itemData: Item
  ): void {
    for (const target of this.dropTargets.values()) {
      if (this.canDropOnTarget(itemData, target)) {
        target.element.classList.add('drop-valid');
      } else {
        target.element.classList.add('drop-invalid');
      }
    }
  }

  /**
   * Clear drop target highlights
   */
  private clearDropTargetHighlights(): void {
    for (const target of this.dropTargets.values()) {
      target.element.classList.remove('drop-valid', 'drop-invalid', 'drop-hover');
    }
  }

  /**
   * Check if item can be dropped on target
   */
  private canDropOnTarget(
     
    itemData: Item,
    target: DropTarget
  ): boolean {
    // Check if target accepts this item type
    if (!target.accepts.includes(itemData.type.toString())) {
      return false;
    }
    
    // Additional checks for equipment slots
    if (target.type === 'equipment') {
      const slotType = target.slot as string;
      
      // Check specific equipment slot compatibility
      const item = itemData as Item;
      if (slotType === 'weapon' && item.type.toString() !== 'weapon') return false;
      if (slotType === 'shield' && item.type.toString() !== 'shield') return false;
      if (slotType === 'arrows' && item.type.toString() !== 'ammunition') return false;
      if ((slotType === 'helmet' || slotType === 'body' || slotType === 'legs') && item.type.toString() !== 'armor') return false;
      
      // Check armor slot compatibility
      if (item.type.toString() === 'armor' && item.equipSlot !== slotType) return false;
    }
    
    return true;
  }

  /**
   * Get accepted item types for equipment slot
   */
  private getAcceptedTypesForEquipmentSlot(slotType: string): string[] {
    switch (slotType) {
      case 'weapon':
        return ['weapon'];
      case 'shield':
        return ['shield'];
      case 'helmet':
      case 'body':
      case 'legs':
        return ['armor'];
      case 'arrows':
        return ['ammunition'];
      default:
        return [];
    }
  }

  /**
   * Get item data from slot
   */
  private getItemInSlot(
    playerId: string, 
    sourceType: 'inventory' | 'equipment', 
    slot: number | string
  ): Item | null {
    if (sourceType === 'inventory') {
      // Strong type assumption - inventory slots are numbers
      return this.getInventoryItem(playerId, slot as number);
    } else if (sourceType === 'equipment') {
      // Strong type assumption - equipment slots are strings
      return this.getEquipmentItem(playerId, slot as string);
    }
    
    return null;
  }

  private getInventoryItem(playerId: string, slot: number): Item | null {
    // Use event-based approach to get inventory item
     
    let inventoryItem: Item | null = null;
    
    // Request item from inventory system via events
    this.emitTypedEvent(EventType.INVENTORY_CHECK, {
      playerId: playerId,
      slot: slot,
       
      callback: (item: Item | null) => {
        if (item) {
          inventoryItem = this.createCompleteItem(item);
        }
      }
    });
    
    return inventoryItem;
  }

  private getEquipmentItem(playerId: string, slot: string): Item | null {
    // Use cached equipment data (reactive pattern)
    const equipment = this.playerEquipment.get(playerId);
    if (!equipment || !equipment[slot]) {
      return null;
    }
    
    const item = equipment[slot];
    return this.createCompleteItem({
      ...item,
      quantity: 1, // Equipment items are always quantity 1
      stackable: false
    });
  }

  /**
   * Find drop target for element
   */
  private findDropTargetForElement(element: Element): DropTarget | null {
    // Walk up the DOM tree to find a drop target
    let currentElement: Element | null = element;
    
    while (currentElement) {
      for (const target of this.dropTargets.values()) {
        if (target.element === currentElement || target.element.contains(currentElement)) {
          return target;
        }
      }
      currentElement = currentElement.parentElement;
    }
    
    return null;
  }

  /**
   * Get current player ID (simplified for MVP)
   */
  private getCurrentPlayerId(): string {
    const localPlayer = this.world.getPlayer();
    return localPlayer?.id || 'player1';
  }

  /**
   * Get item color for visual representation
   */
  private getItemColor(
     
    itemData: Item
  ): string {
    const colorMap: Record<string, string> = {
      'weapon': '#ffffff',
      'armor': '#8b4513',
      'shield': '#4169e1',
      'ammunition': '#ffd700',
      'food': '#32cd32',
      'tool': '#c0c0c0',
      'resource': '#654321'
    };
    
    return colorMap[itemData.type] || '#808080';
  }

  /**
   * Cleanup interactions
   */
  private cleanupInteractions(): void {
    this.dropTargets.clear();
    if (this.isDragging) {
      this.cancelDrag();
    }
  }

  /**
   * Handle player join
   */
  private handlePlayerJoin(_event: { playerId: string }): void {
  }

  /**
   * Handle player leave
   */
  private handlePlayerLeave(event: { playerId: string }): void {
    // Clean up any drag operations for this player
    if (this.currentDrag && this.getCurrentPlayerId() === event.playerId) {
      this.cancelDrag();
    }
    // Clean up context menu
    this.closeContextMenu(event.playerId);
  }

  /**
   * Handle system-level drag start
   */
  private handleDragStart(_event: unknown): void {
    // System-level drag start handling if needed
  }

  /**
   * Handle system-level drag end
   */
  private handleDragEnd(_event: unknown): void {
    // System-level drag end handling if needed
  }

  /**
   * Handle system-level drop
   */
  private handleDrop(_event: unknown): void {
    // System-level drop handling if needed
  }

  /**
   * Get system info for debugging
   */
  getSystemInfo(): { isDragging: boolean; dropTargetsCount: number; currentDrag: { sourceType: string; sourceSlot: number; itemId: string } | null } {
    return {
      isDragging: this.isDragging,
      dropTargetsCount: this.dropTargets.size,
      currentDrag: this.currentDrag ? {
        sourceType: this.currentDrag.sourceType,
        sourceSlot: this.currentDrag.sourceSlot,
        itemId: this.currentDrag.itemId
      } : null
    };
  }

  destroy(): void {
    this.cleanupInteractions();
    this.currentDrag = undefined;
    this.contextMenus.clear();
    this.itemActions.clear();
  }
  
  // === ITEM ACTION METHODS (merged from ItemActionSystem) ===
  
  /**
   * Register default item actions for all item types
   */
  private registerDefaultActions(): void {
    // Equipment actions
    this.registerAction('equipment', {
      id: 'wear',
      label: 'Wear',
      priority: 1,
      condition: (item: Item) => this.isEquippable(item),
      callback: (playerId: string, itemId: string, _slot: number | null) => {
        this.emitTypedEvent(EventType.EQUIPMENT_TRY_EQUIP, {
          playerId: playerId,
          itemId: itemId
        });
      }
    });

    this.registerAction('equipment', {
      id: 'remove',
      label: 'Remove',
      priority: 1,
      condition: (item: Item, playerId: string) => this.isEquippedItem(item, playerId),
      callback: (playerId: string, itemId: string, _slot: number | null) => {
        const item = this.getItemData(itemId);
        if (item) {
          const equipSlot = this.getEquipmentSlotForItem(item);
          if (equipSlot) {
            this.emitTypedEvent(EventType.EQUIPMENT_UNEQUIP, {
              playerId: playerId,
              slot: equipSlot
            });
          }
        }
      }
    });

    // Consumption actions
    this.registerAction('food', {
      id: 'eat',
      label: 'Eat',
      priority: 1,
      condition: (item: Item) => item.type === ItemType.CONSUMABLE,
      callback: (playerId: string, itemId: string, slot: number | null) => {
        this.emitTypedEvent(EventType.INVENTORY_CONSUME_ITEM, {
          playerId: playerId,
          itemId: itemId,
          slot: slot
        });
      }
    });

    // Tool actions
    this.registerAction('tool', {
      id: 'use',
      label: 'Use',
      priority: 1,
      condition: (item: Item) => item.type === ItemType.TOOL,
      callback: (playerId: string, itemId: string, slot: number | null) => {
        this.emitTypedEvent(EventType.UI_MESSAGE, {
          playerId: playerId,
          itemId: itemId,
          slot: slot
        });
      }
    });

    // Universal actions
    this.registerAction('universal', {
      id: 'examine',
      label: 'Examine',
      priority: 10,
      condition: () => true,
      callback: (playerId: string, itemId: string) => {
        const item = this.getItemData(itemId);
        if (item) {
          const description = item.description || `A ${item.name.toLowerCase()}.`;
          this.emitTypedEvent(EventType.UI_MESSAGE, {
            playerId: playerId,
            message: description,
            type: 'info'
          });
        }
      }
    });

    this.registerAction('universal', {
      id: 'drop',
      label: 'Drop',
      priority: 9,
      condition: (item: Item, playerId: string) => !this.isEquippedItem(item, playerId),
      callback: (playerId: string, itemId: string, slot: number | null) => {
        this.emitTypedEvent(EventType.ITEM_DROP, {
          playerId: playerId,
          itemId: itemId,
          slot: slot
        });
      }
    });

    // Ground item actions
    this.registerAction('ground', {
      id: 'take',
      label: 'Take',
      priority: 1,
      condition: () => true,
      callback: (playerId: string, itemId: string) => {
        this.emitTypedEvent(EventType.ITEM_PICKUP, {
          playerId: playerId,
          itemId: itemId
        });
      }
    });
  }

  /**
   * Register a new item action
   */
  public registerAction(category: string, action: ItemAction): void {
    if (!this.itemActions.has(category)) {
      this.itemActions.set(category, []);
    }
    
    const actions = this.itemActions.get(category)!;
    actions.push(action);
    actions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Handle right-click on inventory item
   */
  private handleItemRightClick(event: { playerId: string; itemId: string; slot?: number; position?: { x: number; y: number } }): void {
    const item = this.getItemData(event.itemId);
    if (!item) {
      Logger.system('InventoryInteractionSystem', `Item not found: ${event.itemId}`);
      return;
    }

    const availableActions = this.getAvailableActions(item, event.playerId);
    
    if (availableActions.length === 0) {
      Logger.system('InventoryInteractionSystem', `No actions available for item: ${item.name}`);
      return;
    }

    const contextMenu: ItemContextMenu = {
      playerId: event.playerId,
      itemId: event.itemId,
      slot: event.slot || null,
      actions: availableActions,
      position: event.position || { x: 0, y: 0 },
      visible: true
    };

    this.contextMenus.set(event.playerId, contextMenu);

    this.emitTypedEvent(EventType.UI_OPEN_MENU, {
      playerId: event.playerId,
      actions: availableActions.map(action => action.label)
    });
  }

  /**
   * Handle ground item click
   */
  private handleGroundItemClick(event: { playerId: string; itemId: string; position?: { x: number; y: number } }): void {
    let groundItem: Item | null = null;
    this.emitTypedEvent(EventType.UI_MESSAGE, {
      itemId: event.itemId,
      callback: (item: Item) => { groundItem = item; }
    });
    if (!groundItem) {
      Logger.system('InventoryInteractionSystem', `Ground item not found: ${event.itemId}`);
      return;
    }

    const groundActions = this.itemActions.get('ground') || [];
    const availableActions = groundActions.filter(action => 
      !action.condition || action.condition(groundItem!, event.playerId)
    );

    if (availableActions.length === 0) {
      this.emitTypedEvent(EventType.ITEM_PICKUP, {
        playerId: event.playerId,
        itemId: event.itemId
      });
      return;
    }

    const contextMenu: ItemContextMenu = {
      playerId: event.playerId,
      itemId: event.itemId,
      slot: null,
      actions: availableActions,
      position: event.position || { x: 0, y: 0 },
      visible: true
    };

    this.contextMenus.set(event.playerId, contextMenu);

    this.emitTypedEvent(EventType.UI_OPEN_MENU, {
      playerId: event.playerId,
      actions: availableActions.map(action => action.label)
    });
  }

  /**
   * Handle action selection from context menu
   */
  private handleActionSelected(event: { playerId: string; actionId: string }): void {
    const contextMenu = this.contextMenus.get(event.playerId);
    if (!contextMenu) {
      Logger.system('InventoryInteractionSystem', `No context menu for player: ${event.playerId}`);
      return;
    }

    const action = contextMenu.actions.find(a => a.id === event.actionId);
    if (!action) {
      Logger.system('InventoryInteractionSystem', `Action not found: ${event.actionId}`);
      return;
    }

    action.callback(contextMenu.playerId, contextMenu.itemId, contextMenu.slot);
    this.closeContextMenu(event.playerId);
  }

  /**
   * Close context menu for player
   */
  private closeContextMenu(playerId: string): void {
    this.contextMenus.delete(playerId);
    
    this.emitTypedEvent(EventType.UI_MESSAGE, {
      playerId: playerId
    });
  }

  /**
   * Get available actions for an item
   */
  private getAvailableActions(item: Item, playerId: string): ItemAction[] {
    const availableActions: ItemAction[] = [];

    const equipmentActions = this.itemActions.get('equipment') || [];
    for (const action of equipmentActions) {
      if (!action.condition || action.condition(item, playerId)) {
        availableActions.push(action);
      }
    }

    const typeActions = this.itemActions.get(item.type) || [];
    for (const action of typeActions) {
      if (!action.condition || action.condition(item, playerId)) {
        availableActions.push(action);
      }
    }

    const universalActions = this.itemActions.get('universal') || [];
    for (const action of universalActions) {
      if (!action.condition || action.condition(item, playerId)) {
        availableActions.push(action);
      }
    }

    const uniqueActions = new Map<string, ItemAction>();
    for (const action of availableActions) {
      if (!uniqueActions.has(action.id) || uniqueActions.get(action.id)!.priority > action.priority) {
        uniqueActions.set(action.id, action);
      }
    }

    return Array.from(uniqueActions.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Helper methods for item actions
   */
  private isEquippable(item: Item): boolean {
    return [ItemType.WEAPON, ItemType.ARMOR, ItemType.AMMUNITION].includes(item.type);
  }

  private isEquippedItem(item: Item, playerId: string): boolean {
    let isEquipped = false;
    this.emitTypedEvent(EventType.UI_MESSAGE, {
      playerId: playerId,
      itemId: item.id,
      callback: (equipped: boolean) => { isEquipped = equipped; }
    });
    return isEquipped;
  }

  private getEquipmentSlotForItem(item: Item): string | null {
    switch (item.type) {
      case ItemType.WEAPON:
        return 'weapon';
      case ItemType.ARMOR:
        return item.equipSlot || null;
      case ItemType.AMMUNITION:
        return 'arrows';
      default:
        return null;
    }
  }
  
  private getItemData(itemId: string): Item | null {
    return dataManager.getItem(itemId);
  }

}
