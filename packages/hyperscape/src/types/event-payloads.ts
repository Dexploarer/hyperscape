import { Entity } from '../core/entities/Entity';
import { PlayerLocal } from '../core/entities/PlayerLocal';
import {
  PlayerSkills,
  InventoryItem,
  Position3D
} from '../rpg/types/core';
import { RPGItem } from '../rpg/data/items';

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

// RPG Event Payloads
export interface PlayerLevelUpPayload {
  playerId: string;
  skill: keyof PlayerSkills;
  newLevel: number;
}

export interface PlayerXPGainedPayload {
  playerId: string;
  skill: keyof PlayerSkills;
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
  item: RPGItem;
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
  item: RPGItem;
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
