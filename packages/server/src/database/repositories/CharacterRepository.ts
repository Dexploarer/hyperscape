/**
 * CharacterRepository - Character management operations
 *
 * Handles character (avatar) creation and retrieval for player accounts.
 * Each account can have multiple characters. Characters represent individual
 * player avatars in the game.
 *
 * **ID Format** (post-migration 0008):
 * - character.id = wallet address (e.g., "0x1234...abcd")
 * - Wallet must be derived BEFORE character creation
 * - No separate wallet column - id IS the wallet
 *
 * Responsibilities:
 * - Get list of characters for an account
 * - Create new characters with default stats
 * - Validate character names and enforce uniqueness
 *
 * Used by: Character selection system, ServerNetwork
 */

import { eq } from "drizzle-orm";
import { BaseRepository } from "./BaseRepository";
import * as schema from "../schema";

/**
 * CharacterRepository class
 *
 * Provides all character management operations.
 */
export class CharacterRepository extends BaseRepository {
  /**
   * Get all characters for an account
   *
   * Retrieves a list of all characters (avatars) owned by a specific account.
   * Used to populate the character selection screen.
   *
   * Note: The character id IS the wallet address (post-migration 0008).
   * The returned `wallet` field equals `id` for backwards compatibility.
   *
   * @param accountId - The account/user ID to fetch characters for
   * @returns Array of characters with id (wallet), name, etc.
   */
  async getCharactersAsync(accountId: string): Promise<
    Array<{
      id: string;
      name: string;
      avatar?: string | null;
      wallet: string; // id IS the wallet, always present
      isAgent?: boolean;
      combatLevel?: number | null;
      constitutionLevel?: number | null;
    }>
  > {
    this.ensureDatabase();

    console.log(
      "[CharacterRepository] 📋 Loading characters for accountId:",
      accountId,
    );

    const results = await this.db
      .select({
        id: schema.characters.id,
        name: schema.characters.name,
        avatar: schema.characters.avatar,
        isAgent: schema.characters.isAgent,
        combatLevel: schema.characters.combatLevel,
        constitutionLevel: schema.characters.constitutionLevel,
      })
      .from(schema.characters)
      .where(eq(schema.characters.accountId, accountId));

    console.log(
      "[CharacterRepository] 📋 Found",
      results.length,
      "characters:",
      results,
    );

    // Convert isAgent from number (0/1) to boolean
    // id IS the wallet address now
    return results.map((char) => ({
      ...char,
      wallet: char.id, // id IS the wallet
      isAgent: char.isAgent === 1,
    }));
  }

  /**
   * Create a new character
   *
   * Creates a new character (avatar) for an account with default starting stats.
   * Characters start at level 1 in all skills with initial health and position.
   *
   * **IMPORTANT**: The wallet address IS the character ID. Wallet must be
   * derived from Privy BEFORE calling this method.
   *
   * @param accountId - The account that owns this character
   * @param wallet - Privy HD wallet address - THIS IS THE CHARACTER ID
   * @param name - Display name for the character (validated by caller)
   * @param avatar - Avatar VRM URL (optional)
   * @param isAgent - Whether this character is controlled by an AI agent (default: false)
   * @returns true if created successfully, false if wallet/character already exists
   */
  async createCharacter(
    accountId: string,
    wallet: string,
    name: string,
    avatar?: string,
    isAgent?: boolean,
  ): Promise<boolean> {
    this.ensureDatabase();

    // Wallet is REQUIRED - it's the character ID
    if (!wallet || wallet.trim() === "") {
      console.error(
        "[CharacterRepository] ❌ Cannot create character without wallet address",
      );
      throw new Error("Wallet address is required for character creation");
    }

    const now = Date.now();

    console.log("[CharacterRepository] 🎭 Creating character:", {
      id: wallet, // id IS the wallet
      accountId,
      name,
      avatar,
      isAgent: isAgent || false,
      timestamp: now,
    });

    try {
      await this.db.insert(schema.characters).values({
        id: wallet, // Wallet IS the character ID
        accountId,
        name,
        avatar,
        isAgent: isAgent ? 1 : 0, // Convert boolean to integer for SQLite/PostgreSQL
        createdAt: now,
        lastLogin: now,
      });

      console.log(
        "[CharacterRepository] ✅ Character created successfully in DB",
      );

      // Verify it was saved
      const verify = await this.db
        .select()
        .from(schema.characters)
        .where(eq(schema.characters.id, wallet))
        .limit(1);

      console.log(
        "[CharacterRepository] 🔍 Verification query result:",
        verify,
      );

      return true;
    } catch (error) {
      console.error(
        "[CharacterRepository] ❌ Error creating character:",
        error,
      );
      // Character already exists (PostgreSQL unique constraint violation code)
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "23505"
      ) {
        console.log(
          "[CharacterRepository] Character already exists (duplicate wallet)",
        );
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete a character by ID
   *
   * Permanently removes a character from the database. This is used when
   * users cancel agent creation or explicitly delete unwanted characters.
   *
   * @param characterId - The character ID to delete
   * @returns true if character was deleted, false if not found
   */
  async deleteCharacter(characterId: string): Promise<boolean> {
    this.ensureDatabase();

    console.log("[CharacterRepository] 🗑️  Deleting character:", characterId);

    try {
      const result = await this.db
        .delete(schema.characters)
        .where(eq(schema.characters.id, characterId));

      // Check if any rows were affected
      // Drizzle returns an object with rowCount or similar depending on dialect
      const deleted =
        result && (result as unknown as { rowCount?: number }).rowCount !== 0;

      if (deleted) {
        console.log("[CharacterRepository] ✅ Character deleted successfully");
      } else {
        console.log("[CharacterRepository] ⚠️  Character not found");
      }

      return deleted;
    } catch (error) {
      console.error(
        "[CharacterRepository] ❌ Error deleting character:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get character skills
   *
   * Retrieves skill levels and XP for a character. Used by the dashboard
   * to display agent skill progress in real-time.
   *
   * @param characterId - The character ID to fetch skills for
   * @returns Skills object with level and xp for each skill, or null if not found
   */
  async getCharacterSkills(characterId: string): Promise<{
    attack: { level: number; xp: number };
    strength: { level: number; xp: number };
    defense: { level: number; xp: number };
    constitution: { level: number; xp: number };
    ranged: { level: number; xp: number };
    woodcutting: { level: number; xp: number };
    fishing: { level: number; xp: number };
    firemaking: { level: number; xp: number };
    cooking: { level: number; xp: number };
  } | null> {
    this.ensureDatabase();

    const results = await this.db
      .select({
        attackLevel: schema.characters.attackLevel,
        strengthLevel: schema.characters.strengthLevel,
        defenseLevel: schema.characters.defenseLevel,
        constitutionLevel: schema.characters.constitutionLevel,
        rangedLevel: schema.characters.rangedLevel,
        woodcuttingLevel: schema.characters.woodcuttingLevel,
        fishingLevel: schema.characters.fishingLevel,
        firemakingLevel: schema.characters.firemakingLevel,
        cookingLevel: schema.characters.cookingLevel,
        attackXp: schema.characters.attackXp,
        strengthXp: schema.characters.strengthXp,
        defenseXp: schema.characters.defenseXp,
        constitutionXp: schema.characters.constitutionXp,
        rangedXp: schema.characters.rangedXp,
        woodcuttingXp: schema.characters.woodcuttingXp,
        fishingXp: schema.characters.fishingXp,
        firemakingXp: schema.characters.firemakingXp,
        cookingXp: schema.characters.cookingXp,
      })
      .from(schema.characters)
      .where(eq(schema.characters.id, characterId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];

    return {
      attack: { level: row.attackLevel || 1, xp: row.attackXp || 0 },
      strength: { level: row.strengthLevel || 1, xp: row.strengthXp || 0 },
      defense: { level: row.defenseLevel || 1, xp: row.defenseXp || 0 },
      constitution: {
        level: row.constitutionLevel || 10,
        xp: row.constitutionXp || 1154,
      },
      ranged: { level: row.rangedLevel || 1, xp: row.rangedXp || 0 },
      woodcutting: {
        level: row.woodcuttingLevel || 1,
        xp: row.woodcuttingXp || 0,
      },
      fishing: { level: row.fishingLevel || 1, xp: row.fishingXp || 0 },
      firemaking: {
        level: row.firemakingLevel || 1,
        xp: row.firemakingXp || 0,
      },
      cooking: { level: row.cookingLevel || 1, xp: row.cookingXp || 0 },
    };
  }

  /**
   * Update character's isAgent flag
   *
   * Converts a character between agent and human types. Used when users
   * decide to convert an abandoned agent character to play themselves.
   *
   * @param characterId - The character ID to update
   * @param isAgent - New value for isAgent flag
   * @returns true if character was updated, false if not found
   */
  async updateCharacterIsAgent(
    characterId: string,
    isAgent: boolean,
  ): Promise<boolean> {
    this.ensureDatabase();

    console.log("[CharacterRepository] 🔄 Updating character isAgent:", {
      characterId,
      isAgent,
    });

    try {
      const result = await this.db
        .update(schema.characters)
        .set({ isAgent: isAgent ? 1 : 0 })
        .where(eq(schema.characters.id, characterId));

      // Check if any rows were affected
      const updated =
        result && (result as unknown as { rowCount?: number }).rowCount !== 0;

      if (updated) {
        console.log(
          `[CharacterRepository] ✅ Character updated to ${isAgent ? "agent" : "human"}`,
        );
      } else {
        console.log("[CharacterRepository] ⚠️  Character not found");
      }

      return updated;
    } catch (error) {
      console.error(
        "[CharacterRepository] ❌ Error updating character:",
        error,
      );
      throw error;
    }
  }
}
