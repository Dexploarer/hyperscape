-- Migration: Change character ID from nanoid to wallet address
-- This migration updates the character identification system to use wallet addresses
-- as the primary key instead of generated nanoid/UUID values.
--
-- IMPORTANT: This is a destructive migration for characters without wallets.
-- Characters without wallet addresses will be deleted as they cannot be migrated.
--
-- Affected tables:
-- - characters (id becomes wallet)
-- - inventory (playerId FK)
-- - equipment (playerId FK)
-- - player_sessions (playerId FK)
-- - chunk_activity (playerId FK)
-- - npc_kills (playerId FK)
-- - player_deaths (playerId FK)
-- - agent_mappings (characterId FK)

-- Step 1: Delete characters that don't have wallets (they can't be migrated)
-- First delete dependent records (CASCADE should handle this but being explicit)
DELETE FROM inventory WHERE "playerId" IN (SELECT id FROM characters WHERE wallet IS NULL OR wallet = '');
DELETE FROM equipment WHERE "playerId" IN (SELECT id FROM characters WHERE wallet IS NULL OR wallet = '');
DELETE FROM player_sessions WHERE "playerId" IN (SELECT id FROM characters WHERE wallet IS NULL OR wallet = '');
DELETE FROM chunk_activity WHERE "playerId" IN (SELECT id FROM characters WHERE wallet IS NULL OR wallet = '');
DELETE FROM npc_kills WHERE "playerId" IN (SELECT id FROM characters WHERE wallet IS NULL OR wallet = '');
DELETE FROM player_deaths WHERE "playerId" IN (SELECT id FROM characters WHERE wallet IS NULL OR wallet = '');
DELETE FROM agent_mappings WHERE "character_id" IN (SELECT id FROM characters WHERE wallet IS NULL OR wallet = '');
DELETE FROM characters WHERE wallet IS NULL OR wallet = '';

-- Step 2: Create mapping table for old ID to wallet migration
CREATE TABLE IF NOT EXISTS _character_id_migration (
    old_id TEXT PRIMARY KEY,
    new_id TEXT NOT NULL
);

-- Step 3: Populate mapping table with old_id -> wallet mappings
INSERT INTO _character_id_migration (old_id, new_id)
SELECT id, wallet FROM characters WHERE wallet IS NOT NULL AND wallet != '';

-- Step 4: Temporarily disable foreign key constraints
-- In PostgreSQL, we need to drop and recreate FKs

-- Drop all foreign key constraints referencing characters.id
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_playerId_characters_id_fk;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_playerId_characters_id_fk;
ALTER TABLE player_sessions DROP CONSTRAINT IF EXISTS player_sessions_playerId_characters_id_fk;
ALTER TABLE chunk_activity DROP CONSTRAINT IF EXISTS chunk_activity_playerId_characters_id_fk;
ALTER TABLE npc_kills DROP CONSTRAINT IF EXISTS npc_kills_playerId_characters_id_fk;
ALTER TABLE player_deaths DROP CONSTRAINT IF EXISTS player_deaths_playerId_characters_id_fk;
ALTER TABLE agent_mappings DROP CONSTRAINT IF EXISTS agent_mappings_character_id_characters_id_fk;

-- Step 5: Update all FK references in dependent tables
UPDATE inventory SET "playerId" = (SELECT new_id FROM _character_id_migration WHERE old_id = inventory."playerId")
WHERE EXISTS (SELECT 1 FROM _character_id_migration WHERE old_id = inventory."playerId");

UPDATE equipment SET "playerId" = (SELECT new_id FROM _character_id_migration WHERE old_id = equipment."playerId")
WHERE EXISTS (SELECT 1 FROM _character_id_migration WHERE old_id = equipment."playerId");

UPDATE player_sessions SET "playerId" = (SELECT new_id FROM _character_id_migration WHERE old_id = player_sessions."playerId")
WHERE EXISTS (SELECT 1 FROM _character_id_migration WHERE old_id = player_sessions."playerId");

UPDATE chunk_activity SET "playerId" = (SELECT new_id FROM _character_id_migration WHERE old_id = chunk_activity."playerId")
WHERE EXISTS (SELECT 1 FROM _character_id_migration WHERE old_id = chunk_activity."playerId");

UPDATE npc_kills SET "playerId" = (SELECT new_id FROM _character_id_migration WHERE old_id = npc_kills."playerId")
WHERE EXISTS (SELECT 1 FROM _character_id_migration WHERE old_id = npc_kills."playerId");

UPDATE player_deaths SET "playerId" = (SELECT new_id FROM _character_id_migration WHERE old_id = player_deaths."playerId")
WHERE EXISTS (SELECT 1 FROM _character_id_migration WHERE old_id = player_deaths."playerId");

UPDATE agent_mappings SET "character_id" = (SELECT new_id FROM _character_id_migration WHERE old_id = agent_mappings."character_id")
WHERE EXISTS (SELECT 1 FROM _character_id_migration WHERE old_id = agent_mappings."character_id");

-- Step 6: Update characters.id to wallet value
UPDATE characters SET id = wallet WHERE wallet IS NOT NULL AND wallet != '';

-- Step 7: Remove the now-redundant wallet column (id IS the wallet now)
ALTER TABLE characters DROP COLUMN IF EXISTS wallet;

-- Step 8: Add index on accountId + id for duplicate wallet prevention per account
-- (though wallets should be globally unique anyway)
DROP INDEX IF EXISTS idx_characters_wallet;

-- Step 9: Recreate foreign key constraints with CASCADE DELETE
ALTER TABLE inventory
ADD CONSTRAINT inventory_playerId_characters_id_fk
FOREIGN KEY ("playerId") REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE equipment
ADD CONSTRAINT equipment_playerId_characters_id_fk
FOREIGN KEY ("playerId") REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE player_sessions
ADD CONSTRAINT player_sessions_playerId_characters_id_fk
FOREIGN KEY ("playerId") REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE chunk_activity
ADD CONSTRAINT chunk_activity_playerId_characters_id_fk
FOREIGN KEY ("playerId") REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE npc_kills
ADD CONSTRAINT npc_kills_playerId_characters_id_fk
FOREIGN KEY ("playerId") REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE player_deaths
ADD CONSTRAINT player_deaths_playerId_characters_id_fk
FOREIGN KEY ("playerId") REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE agent_mappings
ADD CONSTRAINT agent_mappings_character_id_characters_id_fk
FOREIGN KEY ("character_id") REFERENCES characters(id) ON DELETE CASCADE;

-- Step 10: Cleanup migration table
DROP TABLE IF EXISTS _character_id_migration;

-- Step 11: Add comment documenting the new ID format
COMMENT ON COLUMN characters.id IS 'Character ID is now the wallet address (was nanoid before migration 0008)';
