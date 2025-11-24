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

-- Wrap entire migration in a transaction for atomicity
BEGIN;

-- Step 0: Validate no duplicate wallets exist (would cause PK violation)
-- If duplicates exist, keep the most recently created character and delete others
DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    -- Count characters with duplicate wallets
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT wallet
        FROM characters
        WHERE wallet IS NOT NULL AND wallet != ''
        GROUP BY wallet
        HAVING COUNT(*) > 1
    ) duplicates;

    IF dup_count > 0 THEN
        RAISE NOTICE 'Found % duplicate wallet(s). Keeping most recent character for each wallet.', dup_count;

        -- Delete older duplicate characters (keep the one with latest createdAt)
        -- First delete dependent records for duplicates
        DELETE FROM inventory WHERE "playerId" IN (
            SELECT id FROM characters c1
            WHERE wallet IS NOT NULL AND wallet != ''
            AND EXISTS (
                SELECT 1 FROM characters c2
                WHERE c2.wallet = c1.wallet
                AND c2.id != c1.id
                AND (c2."createdAt" > c1."createdAt" OR (c2."createdAt" = c1."createdAt" AND c2.id > c1.id))
            )
        );
        DELETE FROM equipment WHERE "playerId" IN (
            SELECT id FROM characters c1
            WHERE wallet IS NOT NULL AND wallet != ''
            AND EXISTS (
                SELECT 1 FROM characters c2
                WHERE c2.wallet = c1.wallet
                AND c2.id != c1.id
                AND (c2."createdAt" > c1."createdAt" OR (c2."createdAt" = c1."createdAt" AND c2.id > c1.id))
            )
        );
        DELETE FROM player_sessions WHERE "playerId" IN (
            SELECT id FROM characters c1
            WHERE wallet IS NOT NULL AND wallet != ''
            AND EXISTS (
                SELECT 1 FROM characters c2
                WHERE c2.wallet = c1.wallet
                AND c2.id != c1.id
                AND (c2."createdAt" > c1."createdAt" OR (c2."createdAt" = c1."createdAt" AND c2.id > c1.id))
            )
        );
        DELETE FROM chunk_activity WHERE "playerId" IN (
            SELECT id FROM characters c1
            WHERE wallet IS NOT NULL AND wallet != ''
            AND EXISTS (
                SELECT 1 FROM characters c2
                WHERE c2.wallet = c1.wallet
                AND c2.id != c1.id
                AND (c2."createdAt" > c1."createdAt" OR (c2."createdAt" = c1."createdAt" AND c2.id > c1.id))
            )
        );
        DELETE FROM npc_kills WHERE "playerId" IN (
            SELECT id FROM characters c1
            WHERE wallet IS NOT NULL AND wallet != ''
            AND EXISTS (
                SELECT 1 FROM characters c2
                WHERE c2.wallet = c1.wallet
                AND c2.id != c1.id
                AND (c2."createdAt" > c1."createdAt" OR (c2."createdAt" = c1."createdAt" AND c2.id > c1.id))
            )
        );
        DELETE FROM player_deaths WHERE "playerId" IN (
            SELECT id FROM characters c1
            WHERE wallet IS NOT NULL AND wallet != ''
            AND EXISTS (
                SELECT 1 FROM characters c2
                WHERE c2.wallet = c1.wallet
                AND c2.id != c1.id
                AND (c2."createdAt" > c1."createdAt" OR (c2."createdAt" = c1."createdAt" AND c2.id > c1.id))
            )
        );
        DELETE FROM agent_mappings WHERE "character_id" IN (
            SELECT id FROM characters c1
            WHERE wallet IS NOT NULL AND wallet != ''
            AND EXISTS (
                SELECT 1 FROM characters c2
                WHERE c2.wallet = c1.wallet
                AND c2.id != c1.id
                AND (c2."createdAt" > c1."createdAt" OR (c2."createdAt" = c1."createdAt" AND c2.id > c1.id))
            )
        );

        -- Delete the duplicate characters (keep newest)
        DELETE FROM characters c1
        WHERE wallet IS NOT NULL AND wallet != ''
        AND EXISTS (
            SELECT 1 FROM characters c2
            WHERE c2.wallet = c1.wallet
            AND c2.id != c1.id
            AND (c2."createdAt" > c1."createdAt" OR (c2."createdAt" = c1."createdAt" AND c2.id > c1.id))
        );

        RAISE NOTICE 'Duplicate wallet cleanup complete.';
    END IF;
END $$;

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
    new_id TEXT NOT NULL UNIQUE  -- Ensure new_id is also unique
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

-- Step 5: Update all FK references in dependent tables using JOIN-based update
UPDATE inventory i SET "playerId" = m.new_id
FROM _character_id_migration m WHERE i."playerId" = m.old_id;

UPDATE equipment e SET "playerId" = m.new_id
FROM _character_id_migration m WHERE e."playerId" = m.old_id;

UPDATE player_sessions ps SET "playerId" = m.new_id
FROM _character_id_migration m WHERE ps."playerId" = m.old_id;

UPDATE chunk_activity ca SET "playerId" = m.new_id
FROM _character_id_migration m WHERE ca."playerId" = m.old_id;

UPDATE npc_kills nk SET "playerId" = m.new_id
FROM _character_id_migration m WHERE nk."playerId" = m.old_id;

UPDATE player_deaths pd SET "playerId" = m.new_id
FROM _character_id_migration m WHERE pd."playerId" = m.old_id;

UPDATE agent_mappings am SET "character_id" = m.new_id
FROM _character_id_migration m WHERE am."character_id" = m.old_id;

-- Step 6: Update characters.id to wallet value
UPDATE characters SET id = wallet WHERE wallet IS NOT NULL AND wallet != '';

-- Step 7: Remove the now-redundant wallet column (id IS the wallet now)
ALTER TABLE characters DROP COLUMN IF EXISTS wallet;

-- Step 8: Remove the old wallet index (no longer needed since wallet column is removed)
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

-- Commit the transaction
COMMIT;
