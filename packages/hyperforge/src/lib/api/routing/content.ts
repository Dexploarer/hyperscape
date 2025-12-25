/**
 * Content API Router
 * 
 * Handles game content generation and management:
 * - Generating quests, areas, items, stores
 * - Listing content assets
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/utils";
import {
  listContentAssets,
  isSupabaseConfigured,
} from "@/lib/storage/supabase-storage";
import { TASK_MODELS } from "@/lib/ai/providers";
import {
  createGetRoute,
  createPostRoute,
} from "./base";
import {
  ValidationError,
  GenerationError,
  ContentGenerationSchema,
  DialogueGenerationSchema,
  validationErrorResponse,
} from "@/lib/api";
import type { ValidatedHandler } from "./types";
import type {
  Quest,
  QuestObjective,
  WorldArea,
  Item,
  Store,
} from "@/types/game/content-types";
import type { DialogueGenerationContext } from "@/types/game/dialogue-types";

const log = logger.child("API:Content");

const model = gateway(TASK_MODELS.contentGeneration);

/**
 * Generate quest content
 */
async function generateQuest(req: {
  name?: string;
  category?: "main" | "side" | "daily" | "event";
  difficulty?: "easy" | "medium" | "hard" | "legendary";
  theme?: string;
  startNpc?: { id: string; name: string };
  targetLevel?: number;
  objectives?: string;
  lore?: string;
}): Promise<Quest> {
  const prompt = `Generate a quest for a RuneScape-style MMORPG.

Quest Parameters:
- Name: ${req.name || "Generate a creative name"}
- Category: ${req.category || "side"}
- Difficulty: ${req.difficulty || "medium"}
- Theme/Setting: ${req.theme || "general fantasy"}
- Target Level: ${req.targetLevel || 10}
${req.startNpc ? `- Quest Giver: ${req.startNpc.name} (${req.startNpc.id})` : ""}
${req.objectives ? `- Objectives Hint: ${req.objectives}` : ""}
${req.lore ? `- World Lore: ${req.lore}` : ""}

Generate a quest with the following structure (JSON only, no markdown):
{
  "name": "Quest Name",
  "description": "2-3 sentence description shown in quest log",
  "objectives": [
    {
      "id": "obj_1",
      "type": "kill|collect|deliver|talk|explore|craft|skill|interact",
      "target": "target_id",
      "targetName": "Display Name",
      "quantity": 5,
      "description": "Kill 5 Goblins",
      "optional": false,
      "hint": "Optional hint for players"
    }
  ],
  "rewards": [
    {"type": "xp", "name": "Experience", "quantity": 500},
    {"type": "gold", "name": "Gold Coins", "quantity": 100},
    {"type": "item", "id": "item_id", "name": "Item Name", "quantity": 1}
  ],
  "requirements": [
    {"type": "level", "name": "Combat Level", "value": 5}
  ],
  "lore": "Detailed backstory and context (3-4 sentences)",
  "hint": "A subtle hint if players get stuck"
}

Rules:
1. Create 2-5 objectives that tell a story
2. Include appropriate rewards for the difficulty
3. Make objectives specific with real game entities (goblins, bronze_sword, etc.)
4. Use snake_case for IDs
5. Make the quest feel like authentic RuneScape content`;

  const result = await generateText({
    model,
    prompt,
    temperature: 0.8,
  });

  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new GenerationError("Failed to parse quest JSON from AI response", {
      stage: "parsing",
    });
  }

  const questData = JSON.parse(jsonMatch[0]);
  const questId = req.name
    ? req.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    : `quest_${uuidv4().slice(0, 8)}`;

  return {
    id: questId,
    name: questData.name,
    description: questData.description,
    category: req.category || "side",
    difficulty: req.difficulty || "medium",
    recommendedLevel: req.targetLevel || 10,
    objectives: questData.objectives.map((obj: QuestObjective, i: number) => ({
      ...obj,
      id: obj.id || `obj_${i + 1}`,
    })),
    rewards: questData.rewards,
    requirements: questData.requirements,
    startNpcId: req.startNpc?.id || "quest_giver",
    startNpcName: req.startNpc?.name || "Quest Giver",
    lore: questData.lore,
    hint: questData.hint,
    repeatable: req.category === "daily",
    cooldown: req.category === "daily" ? 1440 : undefined,
  };
}

/**
 * Generate area content
 */
async function generateArea(req: {
  name?: string;
  biome?: string;
  difficultyLevel?: number;
  size?: "small" | "medium" | "large";
  safeZone?: boolean;
  theme?: string;
  includeNpcs?: boolean;
  includeResources?: boolean;
  includeMobs?: boolean;
}): Promise<WorldArea> {
  const sizeMap = { small: 20, medium: 40, large: 80 };
  const halfSize = sizeMap[req.size || "medium"] / 2;

  const prompt = `Generate a world area for a RuneScape-style MMORPG.

Area Parameters:
- Name: ${req.name || "Generate a creative name"}
- Biome: ${req.biome || "forest"}
- Difficulty Level: ${req.difficultyLevel ?? 1} (0=safe, 1-2=easy, 3-4=medium, 5=hard)
- Size: ${req.size || "medium"} (bounds: -${halfSize} to ${halfSize})
- Safe Zone: ${req.safeZone ?? false}
- Theme: ${req.theme || "general fantasy"}

Generate area data (JSON only, no markdown):
{
  "name": "Area Name",
  "description": "Atmospheric description (2-3 sentences)",
  "npcs": [
    {"id": "npc_id", "type": "shopkeeper|banker|guard|quest", "position": {"x": 5, "y": 0, "z": -5}}
  ],
  "resources": [
    {"type": "tree|rock|fishing_spot", "resourceId": "tree_normal", "position": {"x": 10, "y": 0, "z": 10}}
  ],
  "mobSpawns": [
    {"mobId": "goblin", "mobName": "Goblin", "position": {"x": 0, "y": 0, "z": 15}, "spawnRadius": 5, "maxCount": 3}
  ],
  "ambientSound": "forest_birds|wind_plains|water_river",
  "colorScheme": {"primary": "#2E7D32", "secondary": "#66BB6A", "fog": "#B0BEC5"}
}

Rules:
1. Place ${req.includeNpcs !== false ? "1-3 NPCs" : "no NPCs"} appropriate to the area
2. Add ${req.includeResources !== false ? "3-6 resources" : "no resources"} matching the biome
3. Include ${req.includeMobs !== false && !req.safeZone ? "1-3 mob spawn points" : "no mob spawns"}
4. Use existing game IDs: tree_normal, tree_oak, goblin, bank_clerk, shopkeeper
5. Position within bounds: x/z between -${halfSize} and ${halfSize}, y=0`;

  const result = await generateText({
    model,
    prompt,
    temperature: 0.7,
  });

  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new GenerationError("Failed to parse area JSON from AI response", {
      stage: "parsing",
    });
  }

  const areaData = JSON.parse(jsonMatch[0]);
  const areaId = req.name
    ? req.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    : `area_${uuidv4().slice(0, 8)}`;

  return {
    id: areaId,
    name: areaData.name,
    description: areaData.description,
    difficultyLevel: req.difficultyLevel ?? 1,
    bounds: {
      minX: -halfSize,
      maxX: halfSize,
      minZ: -halfSize,
      maxZ: halfSize,
    },
    biomeType: req.biome || "forest",
    safeZone: req.safeZone ?? false,
    npcs: areaData.npcs || [],
    resources: areaData.resources || [],
    mobSpawns: areaData.mobSpawns || [],
    ambientSound: areaData.ambientSound,
    colorScheme: areaData.colorScheme,
  };
}

/**
 * Generate item content
 */
async function generateItem(req: {
  name?: string;
  itemType?: string;
  rarity?: string;
  level?: number;
  theme?: string;
  equipSlot?: string;
}): Promise<Item> {
  const prompt = `Generate an item for a RuneScape-style MMORPG.

Item Parameters:
- Name: ${req.name || "Generate a creative name"}
- Type: ${req.itemType || "weapon"}
- Rarity: ${req.rarity || "uncommon"}
- Level Requirement: ${req.level || 10}
- Theme: ${req.theme || "general fantasy"}
${req.equipSlot ? `- Equipment Slot: ${req.equipSlot}` : ""}

Generate item data (JSON only, no markdown):
{
  "name": "Item Name",
  "description": "Short description for tooltips",
  "examine": "What players see when examining (flavor text)",
  "value": 500,
  "weight": 2.5,
  "stackable": false,
  "tradeable": true,
  "equipSlot": "weapon|head|body|legs|hands|feet|cape|neck|ring|shield",
  "weaponType": "SWORD|AXE|MACE|DAGGER|SPEAR|BOW|STAFF|WAND",
  "attackType": "MELEE|RANGED|MAGIC",
  "attackSpeed": 4,
  "attackRange": 1,
  "bonuses": {
    "attack": 15,
    "strength": 12,
    "defense": 5,
    "ranged": 0,
    "magic": 0
  },
  "requirements": {
    "level": 10,
    "skills": {"attack": 10}
  }
}

Rules:
1. Balance stats based on rarity and level
2. Value should scale: common(100), uncommon(500), rare(2000), epic(10000), legendary(50000+)
3. Bonuses should be appropriate for the item type
4. Include lore-appropriate examine text
5. Make it feel like authentic RuneScape equipment`;

  const result = await generateText({
    model,
    prompt,
    temperature: 0.7,
  });

  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new GenerationError("Failed to parse item JSON from AI response", {
      stage: "parsing",
    });
  }

  const itemData = JSON.parse(jsonMatch[0]);
  const itemId = req.name
    ? req.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    : `item_${uuidv4().slice(0, 8)}`;

  return {
    id: itemId,
    name: itemData.name,
    type: (req.itemType as Item["type"]) || "weapon",
    description: itemData.description,
    examine: itemData.examine,
    rarity: (req.rarity as Item["rarity"]) || "uncommon",
    value: itemData.value,
    weight: itemData.weight,
    stackable: itemData.stackable ?? false,
    tradeable: itemData.tradeable ?? true,
    equipSlot: itemData.equipSlot,
    weaponType: itemData.weaponType,
    attackType: itemData.attackType,
    attackSpeed: itemData.attackSpeed,
    attackRange: itemData.attackRange,
    bonuses: itemData.bonuses,
    requirements: itemData.requirements,
  };
}

/**
 * Generate store content
 */
async function generateStore(req: {
  name?: string;
  storeType?: string;
  owner?: { id: string; name: string };
  location?: string;
  itemCount?: number;
  priceRange?: "cheap" | "normal" | "expensive";
}): Promise<Store> {
  const prompt = `Generate a shop/store for a RuneScape-style MMORPG.

Store Parameters:
- Name: ${req.name || "Generate a creative name"}
- Type: ${req.storeType || "general"}
- Owner: ${req.owner?.name || "Generate a shopkeeper name"}
- Location: ${req.location || "Central Town"}
- Number of Items: ${req.itemCount || 8}
- Price Range: ${req.priceRange || "normal"}

Generate store data (JSON only, no markdown):
{
  "name": "Store Name",
  "type": "general|weapon|armor|magic|food|specialty",
  "ownerName": "Shopkeeper Name",
  "description": "Brief description of the shop",
  "items": [
    {"itemId": "bronze_sword", "itemName": "Bronze Sword", "basePrice": 100, "stock": 10},
    {"itemId": "logs", "itemName": "Logs", "basePrice": 5, "stock": "unlimited"}
  ],
  "buybackRate": 0.4
}

Rules:
1. Use existing game item IDs where possible: bronze_sword, steel_sword, chainbody, logs, coins
2. Stock can be a number or "unlimited" for common items
3. Buyback rate typically 0.3-0.5 (30-50% of base price)
4. Include a mix of stock types based on store type
5. Prices should be balanced for the store type`;

  const result = await generateText({
    model,
    prompt,
    temperature: 0.7,
  });

  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new GenerationError("Failed to parse store JSON from AI response", {
      stage: "parsing",
    });
  }

  const storeData = JSON.parse(jsonMatch[0]);
  const storeId = req.name
    ? req.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    : `store_${uuidv4().slice(0, 8)}`;

  return {
    id: storeId,
    name: storeData.name,
    type: storeData.type || "general",
    ownerId: req.owner?.id,
    ownerName: storeData.ownerName || req.owner?.name,
    location: req.location,
    description: storeData.description,
    items: storeData.items,
    buybackRate: storeData.buybackRate || 0.4,
  };
}

/**
 * Generate content (quest, area, item, or store)
 */
async function generateContent(
  _request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof ContentGenerationSchema.parse>,
): Promise<NextResponse> {
  const { type, ...params } = body;

  const generatedAt = new Date().toISOString();

  switch (type) {
    case "quest": {
      const quest = await generateQuest(params);
      return NextResponse.json({
        success: true,
        content: {
          quest,
          generatedAt,
          prompt: JSON.stringify(params),
        },
      });
    }

    case "area": {
      const area = await generateArea(params);
      return NextResponse.json({
        success: true,
        content: {
          area,
          generatedAt,
          prompt: JSON.stringify(params),
        },
      });
    }

    case "item": {
      const item = await generateItem(params);
      return NextResponse.json({
        success: true,
        content: {
          item,
          generatedAt,
          prompt: JSON.stringify(params),
        },
      });
    }

    case "store": {
      const store = await generateStore(params);
      return NextResponse.json({
        success: true,
        content: {
          store,
          generatedAt,
          prompt: JSON.stringify(params),
        },
      });
    }

    default:
      throw new ValidationError(`Unknown content type: ${type}`);
  }
}

/**
 * List all content assets
 */
async function listContent(): Promise<NextResponse> {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        assets: [],
        message: "Supabase not configured",
      });
    }

    const assets = await listContentAssets();

    // Fetch actual content for each asset
    const assetsWithContent = await Promise.all(
      assets.map(async (asset) => {
        try {
          const response = await fetch(asset.url);
          if (response.ok) {
            const content = await response.json();
            return {
              ...asset,
              content,
            };
          }
        } catch (error) {
          log.warn("Failed to fetch content", { url: asset.url, error });
        }
        return asset;
      }),
    );

    return NextResponse.json({
      success: true,
      assets: assetsWithContent,
    });
  } catch (error) {
    log.error("Failed to list content assets", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list content assets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Generate dialogue
 */
async function generateDialogue(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof DialogueGenerationSchema.parse>,
): Promise<NextResponse> {
  const {
    generateDialogueTree,
    generateNPCContent,
    createEmptyDialogueTree,
  } = await import("@/lib/generation/dialogue-generator");

  const { action, ...params } = body;

  switch (action) {
    case "generate": {
      if (!params.npcName || !params.npcDescription) {
        throw new ValidationError("NPC name and description are required", {
          field: "npcName",
        });
      }

      // Map schema category to DialogueGenerationContext category
      const categoryMap: Record<string, "mob" | "boss" | "neutral" | "quest"> = {
        neutral: "neutral",
        friendly: "neutral",
        hostile: "mob",
        merchant: "neutral",
        quest: "quest",
      };

      const context: DialogueGenerationContext = {
        npcName: params.npcName,
        npcDescription: params.npcDescription,
        npcCategory: params.npcCategory
          ? (categoryMap[params.npcCategory] || "neutral")
          : "neutral",
        npcPersonality: params.npcPersonality,
        npcRole: params.npcRole,
        services: params.services,
        questContext: params.questContext
          ? typeof params.questContext === "string"
            ? undefined
            : params.questContext
          : undefined,
        lore: params.lore,
        tone: params.tone as "friendly" | "grumpy" | "mysterious" | "aggressive" | "formal" | undefined,
      };

      const dialogue = await generateDialogueTree(context);

      return NextResponse.json({
        success: true,
        dialogue,
        nodeCount: dialogue.nodes.length,
      });
    }

    case "generateFull": {
      if (!params.npcName || !params.npcDescription) {
        throw new ValidationError("NPC name and description are required", {
          field: "npcName",
        });
      }

      // Map schema category to DialogueGenerationContext category
      const categoryMap: Record<string, "mob" | "boss" | "neutral" | "quest"> = {
        neutral: "neutral",
        friendly: "neutral",
        hostile: "mob",
        merchant: "neutral",
        quest: "quest",
      };

      const context: DialogueGenerationContext = {
        npcName: params.npcName,
        npcDescription: params.npcDescription,
        npcCategory: params.npcCategory
          ? (categoryMap[params.npcCategory] || "neutral")
          : "neutral",
        npcPersonality: params.npcPersonality,
        npcRole: params.npcRole,
        services: params.services,
        questContext: params.questContext
          ? typeof params.questContext === "string"
            ? undefined
            : params.questContext
          : undefined,
        lore: params.lore,
        tone: params.tone as "friendly" | "grumpy" | "mysterious" | "aggressive" | "formal" | undefined,
      };

      if (!context.npcName || !context.npcDescription) {
        throw new ValidationError("NPC name and description are required", {
          field: "npcName",
        });
      }

      const content = await generateNPCContent(
        context,
        params.generateBackstory !== false,
      );

      return NextResponse.json({
        success: true,
        content,
      });
    }

    case "createEmpty": {
      const npcName = params.npcName || "Unknown NPC";
      const dialogue = createEmptyDialogueTree(npcName);

      return NextResponse.json({
        success: true,
        dialogue,
      });
    }

    default: {
      const _exhaustive: never = action;
      throw new ValidationError(
        `Invalid action: ${(_exhaustive as string)}. Use 'generate', 'generateFull', or 'createEmpty'`,
        { field: "action" },
      );
    }
  }
}

/**
 * Content API routes
 */
export const contentRoutes = {
  GET: {
    list: createGetRoute(listContent),
  },
  POST: {
    generate: createPostRoute(
      ContentGenerationSchema,
      generateContent as ValidatedHandler<
        ReturnType<typeof ContentGenerationSchema.parse>
      >,
    ),
    dialogue: createPostRoute(
      DialogueGenerationSchema,
      generateDialogue as ValidatedHandler<
        ReturnType<typeof DialogueGenerationSchema.parse>
      >,
    ),
  },
};
